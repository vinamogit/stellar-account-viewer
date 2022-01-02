const freighter = window.freighterApi;

async function retrievePublicKey() {
    let publicKey = "";
    let error = "";
    try {
        publicKey = await freighter.getPublicKey();
    } catch (e) {
        error = e;
    }

    if (error) {
        // return error;
        console.log(error)
    }

    return publicKey;
}

async function retrieveNetwork() {
    let network = "";
    let error = "";
    try {
        network = await freighter.getNetwork();
    } catch (e) {
        error = e;
    }

    if (error) {
        // return error;
        console.log(error)
    }

    return network;
}