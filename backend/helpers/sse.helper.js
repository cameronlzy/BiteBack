const sseClients = new Map();

export function addClient(customerId, res) {
    sseClients.set(customerId, res);
}

export function removeClient(customerId) {
    sseClients.delete(customerId);
}

export function notifyClient(customerId, payload) {
    const client = sseClients.get(customerId);
    if (client) {
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
}
