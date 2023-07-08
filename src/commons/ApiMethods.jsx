export const getOrders = async () => {
    let response = await fetch('https://app-modulo-administrador-production.up.railway.app/orders', {
        headers: {
            'Accept': 'application/json'
        }
    });
    return await response.json();
};

export const getDishXOrder = async () => {
    let response = await fetch('https://app-modulo-administrador-production.up.railway.app/dishxorders', {
        headers: {
            'Accept': 'application/json'
        }
    });
    return await response.json();
};

export const getUser = async (email) => {
    let response = await fetch('https://app-modulo-administrador-production.up.railway.app/chefs/buscar_por_email', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });
    return await response.json();
};

export const getStates = async () => {
    let response = await fetch('https://app-modulo-administrador-production.up.railway.app/states', {
        headers: {
            'Accept': 'application/json'
        }
    })
    return await response.json();
};

export const getClientById = async (id) => {
    let response = await fetch(`https://app-modulo-administrador-production.up.railway.app/clients/${id}`, {
        headers: {
            'Accept': 'application/json'
        }
    })
    return await response.json();
};

export const updateOrder = async (id, order_state) => {
    const res = await fetch(`https://app-modulo-administrador-production.up.railway.app/orders/${id}`, {
        method: 'PUT',
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({order_state})
    });
    return await res.json();
};