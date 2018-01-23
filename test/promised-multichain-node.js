import MultichainNode from 'multichain-node'
import logger from 'console-server';

class PromisedMultichainNode {

    constructor(multichainHost, multichainPort, multichainUser, multichainPass) {
        this.multichainNode = MultichainNode({
            port: multichainPort,
            host: multichainHost,
            user: multichainUser,
            pass: multichainPass,
            timeout: 5000
        });
    }

    listAddressTransactions(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.listAddressTransactions(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    getAddressBalances(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.getAddressBalances(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    getTxOut(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.getTxOut(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    sendAssetFrom(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.sendAssetFrom(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    lockUnspent(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.lockUnspent(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    createRawExchange(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.createRawExchange(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    appendRawExchange(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.appendRawExchange(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    appendRawExchange(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.appendRawExchange(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    decodeRawexchange(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.decodeRawexchange(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    sendRawTransaction(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.sendRawTransaction(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    getNewAddress(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.getNewAddress(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    grant(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.grant(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    listUnspent(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.listUnspent(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    prepareLockUnspentFrom(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.prepareLockUnspentFrom(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    issue(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.issue(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    issueMore(param) {
        return new Promise((resolve, reject) => {
            this.multichainNode.issueMore(param, (err, result) => {
                this.handleResponse(err, resolve, reject, result);
            });
        });
    }

    handleResponse(err, resolve, reject, resp) {
        if (!err) {
            resolve(resp);
        } else {
            logger.error('Error executing operation on Multichain', err);
            reject(err);
        }
    }
    
}

export default PromisedMultichainNode;
