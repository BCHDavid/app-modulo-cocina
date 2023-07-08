import ActionCable from 'actioncable';

const cable = ActionCable.createConsumer('https://app-modulo-administrador-production.up.railway.app/cable');
export default cable;