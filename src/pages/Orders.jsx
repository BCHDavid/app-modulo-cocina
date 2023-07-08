import React, { useState, useEffect } from 'react';
import '../Styles/Orders.css';
import { getOrders, getDishXOrder, getStates, updateOrder, getClientById } from '../commons/ApiMethods';
import cable from '../cable';
import { useNavigate } from "react-router-dom";

function Order() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 5;
    const [states, setStates] = useState([]);
    const [showUndoButton, setShowUndoButton] = useState(false);

    useEffect(() => {
        loadStates();
        loadOrdersAndDishes();
        const channel = cable.subscriptions.create('OrdersChannel', {
            received: (data) => {
                setTimeout(async () => {
                    const dataClient = await getClientById(data.order.client_id);
                    const dishesData = await getDishXOrder();
                    const filteredDishes = dishesData
                        .filter((dishItem) => dishItem.order.order_id === data.order.id)
                        .map((dishItem) => dishItem.dish);
                    data.order.dishes = filteredDishes;
                    data.order.client_full_name = dataClient.client.client_full_name;
                    if (data.order.id !== orders.id) {
                        setOrders((prevOrders) => [...prevOrders, data.order]);
                    };
                }, 1000);
            },
        });
    }, []);

    useEffect(() => {
        const updateOrdersStatus = async () => {
            const updatedOrders = orders.map(async (order) => {
                if (order.order_state !== 'delivered') {
                    const deliveryTime = getDeliveryTime(order);
                    if (deliveryTime === 'overTime') {
                        await updateOrder(order.id, 1);
                    } else if (deliveryTime === 'late') {
                        await updateOrder(order.id, 2);
                    };
                    return { ...order, delivery_status: deliveryTime };
                } else {
                    return order;
                };
            });
            const resolvedOrders = await Promise.all(updatedOrders);
            setOrders(resolvedOrders);
        };
        const interval = setInterval(updateOrdersStatus, 8500);
        return () => clearInterval(interval);
    }, [orders]);

    const loadOrdersAndDishes = async () => {
        const ordersData = await getOrders();
        const dishesData = await getDishXOrder();
        if (ordersData.length > 0) {
            const formattedData = ordersData.reduce((acc, orderItem) => {
                if (orderItem.order_state !== "delivered" && orderItem.order_state !== "canceled") {
                    if (
                        orderItem.order_state === "onTime" ||
                        orderItem.order_state === "overTime" ||
                        orderItem.order_state === "late"
                    ) {
                        const order = {
                            id: orderItem.order_id,
                            order_time: orderItem.order_time,
                            order_date: orderItem.order_date,
                            order_state: orderItem.order_state,
                            client_full_name: orderItem.client.full_name,
                        };
                        const filteredDishes = dishesData
                            .filter((dishItem) => dishItem.order.order_id === orderItem.order_id)
                            .map((dishItem) => dishItem.dish);

                        order.dishes = filteredDishes;
                        acc.push(order);
                    }
                }
                return acc;
            }, []);
            setOrders(formattedData);
        }
    };

    const loadStates = async () => {
        const statesData = await getStates();
        setStates(statesData);
    };

    const getCurrentTime = () => {
        const currentDate = new Date();
        const hours = currentDate.getHours();
        const minutes = currentDate.getMinutes();
        return { hours, minutes };
    };

    const getDeliveryTime = (order) => {
        const { order_time } = order;
        const { hours: orderHours, minutes: orderMinutes } = parseOrderTime(order_time);
        const { ontime, overtime, late } = states[0];

        const currentTime = getCurrentTime();
        const totalMinutes = currentTime.hours * 60 + currentTime.minutes;
        const orderTotalMinutes = orderHours * 60 + orderMinutes;

        let deliveryTime = orderTotalMinutes + ontime; 
        let overtimeThreshold = orderTotalMinutes + overtime;
        let lateThreshold = orderTotalMinutes + late;

        if (deliveryTime < 0) {
            deliveryTime += 1440;
        }
        if (overtimeThreshold < 0) {
            overtimeThreshold += 1440;
        }
        if (lateThreshold < 0) {
            lateThreshold += 1440;
        }

        if (totalMinutes <= deliveryTime) {
            return 'onTime';
        } else if (totalMinutes <= overtimeThreshold) {
            return 'overTime';
        } else {
            return 'late';
        }
    };

    const parseOrderTime = (orderTime) => {
        const date = new Date(orderTime);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        return { hours, minutes, seconds };
    };

    const handleUndo = () => {
        const storedOrder = JSON.parse(localStorage.getItem('order'));
        if (storedOrder) {
            updateOrder(storedOrder.id, storedOrder.order_state);
            localStorage.removeItem('order');

            const updatedOrders = orders.map((o) => {
                if (o.id === storedOrder.id) {
                    return { ...o, order_state: storedOrder.order_state, delivery_status: storedOrder.delivery_status };
                }
                return o;
            });
            setOrders(updatedOrders);
        }
    };

    const handleUpdate = async (order) => {
        if (order.order_state !== 'late' && order.order_state !== 'delivered') {
            localStorage.setItem('order', JSON.stringify(order));
            const res = await updateOrder(order.id, 4);
            setShowUndoButton(true);
            setTimeout(() => {
                setShowUndoButton(false);
            }, 4000);
            setTimeout(() => {
                const undoButton = document.getElementById('undoButton');
                if (undoButton) {
                    undoButton.style.display = 'none';
                    localStorage.removeItem('order');
                }
            }, 4000);
            const undoButton = document.getElementById('undoButton');
            if (undoButton) {
                undoButton.addEventListener('click', () => {
                    const storedOrder = JSON.parse(localStorage.getItem('order'));
                    if (storedOrder) {
                        updateOrder(storedOrder.id, storedOrder.order_state);
                        localStorage.removeItem('order');
                        undoButton.style.display = 'none';

                        const updatedOrders = orders.map((o) => {
                            if (o.id === storedOrder.id) {
                                return { ...o, order_state: storedOrder.order_state, delivery_status: storedOrder.delivery_status };
                            }
                            return o;
                        });
                        setOrders(updatedOrders);
                    }
                });
            }

            if (res) {
                const updatedOrders = orders.map((o) => {
                    if (o.id === order.id) {
                        return { ...o, order_state: 'delivered', delivery_status: 'delivered' };
                    }
                    return o;
                });
                setOrders(updatedOrders);
            }
        } else {
            const res = await updateOrder(order.id, 4);
            if (res) {
                const updatedOrders = orders.map((o) => {
                    if (o.id === order.id) {
                        return { ...o, order_state: 'delivered', delivery_status: 'delivered' };
                    }
                    return o;
                });
                setOrders(updatedOrders);
            }
        }
    };
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = orders
        .filter((order, index, self) => {
            return (
                order.order_state !== 'delivered' &&
                self.findIndex((o) => o.id === order.id) === index
            );
        })
        .slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const nextPage = () => {
        setCurrentPage(currentPage + 1);
    };
    const prevPage = () => {
        setCurrentPage(currentPage - 1);
    };
    return (
        <div className="container">
            <button className="logout-button" onClick={() => navigate('/')}>
                Log out
            </button>
            <h1 className="title">LISTA DE PEDIDOS</h1>
            {showUndoButton && (
                <div className="undo-overlay">
                    <div className="undo-container">
                        <button id="undoButton" className="undo-button" onClick={handleUndo}>
                            Deshacer
                        </button>
                    </div>
                </div>
            )}
            <div className="order-list">
                {currentOrders.map((order, index) => (
                    <div className="content" style={{ marginRight: '50px', marginBottom: '50px' }} key={order.id}>
                        <div className="left-content">
                            <div>
                                <h4>Nombre del cliente:</h4>
                                <p>{order.client_full_name}</p>
                                <h4>Lista de platos:</h4>
                                {order.dishes.map((dish, index) => (
                                    <p key={index}>{dish.dish_name}</p>
                                ))}
                            </div>
                        </div>
                        <div className="center-content">
                            <div className="plate-image">
                                <img src={order.dishes[0].image} alt="" />
                            </div>
                        </div>
                        <div className="right-content">
                            <button className="button-delivery" onClick={() => handleUpdate(order)}>
                                Entregar Pedido
                            </button>
                            <div>
                                <h4>Estado de la orden:</h4>
                                <button className={`delivery-status-container ${order.delivery_status}`}>
                                    {order.delivery_status}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="pagination">
                <div className="pagination-text">
                    <button onClick={prevPage} disabled={currentPage === 1} className="pagination-button">
                        Anterior
                    </button>
                    <span>{currentPage}</span>
                    <button onClick={nextPage} disabled={currentPage === totalPages} className="pagination-button">
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Order;
