/*
 *
 * ASSETS / BALANCES
 * 
 */

const divCreation = document.getElementById('creation');
var urlParams = new URLSearchParams(window.location.search);
const accountId = urlParams.get('accountId');
if (accountId) {
    fieldPubKey.value = accountId;
    loadAccount(accountId);

    var menu = document.getElementsByClassName("menu");
    for (var m of menu) {
        m.href += "?accountId=" + accountId + "&network=" + Horizon.network;
    }
}



async function loadAccount(pubKey) {
    let loading = document.getElementById("loading");
    loading.innerHTML = "Loading...";
    divCreation.innerHTML = "";

    let start = new Date();
    if (validateAccount(pubKey)) {
        await loadBalances(pubKey);
    }
    loading.innerHTML = "";
    let end = new Date();

    console.log("Loading time: " + ((end - start) / 1000));
}

async function loadBalances(pubKey) {

    /*
    * Balances
    */


    let data = await Horizon.accounts(pubKey);

    var model = {
        creation: {
            date: "",
            founder: ""
        },
        assets: [],
        evaluation: 0,
    };

    if (data.balances) {
        var promises = [];
        for (var b of data.balances) {
            if (b.asset_type == "liquidity_pool_shares") {
                continue;
            }
            let asset = undefined;
            if (b.asset_code) {
                asset = b.asset_code + ':' + b.asset_issuer;
            } else {
                asset = "native";
            }

            if (!model.assets.includes(asset)) {
                model.assets.push(asset);
                // model[asset] = [];
            }

            /*
                Estimate the price of the asset with the best price for 1 token. The result is overrated.
                Note: To be compared with the trade aggregation of the last hour maybe
            */
            let path = findBestPath(asset, 1, "EURT:GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S");
            promises.push(path);

            model[asset] = {
                amount: b.balance,
                price: 0,
                currency: "€"
            };
        }

        await Promise.all(promises).then((paths) => {
            for (var p of paths) {
                if (p.asset.code) {
                    let a = "native";
                    if (p.asset.code != "native") {
                        a = p.asset.code + ':' + p.asset.issuer;
                    }

                    model[a].price = model[a].amount * p.amount;
                    model.evaluation += model[a].price;
                }
            }
        });

        data = await Horizon.operations(pubKey);
        for (var d of data._embedded.records) {
            if (d.type_i == 0 && d.account == pubKey) {
                model.creation = {
                    date: d.created_at,
                    funder: d.funder
                };
            }
        }

        drawBalances(model);
    } else {
        if (data.status && data.status == 404) {
            document.getElementById("creation").innerHTML = "Account not found";
        } else {

            console.log(data)
        }
    }
}


async function drawBalances(model) {

    // console.log(model)

    async function draw(asset, image, balance) {

        let table = "";
        table += '<tr>';
        table += '<td rowspan="2">';
        table += '<img class="asset-img ' + asset.code + ':' + asset.issuer + '"  src="' + image + '" />';
        table += '</td>';
        table += '<td>';
        table += Utils.formatAmount(balance.amount) + ' <span class="lighter">(' + Utils.formatAmount(balance.price, 2) + balance.currency + ')</span>';
        table += '</td>';
        table += '</tr>';

        table += '<tr>';
        let issuer = (asset.issuer != "") ? "-" + asset.issuer : "";
        table += '<td class="lighter"><a target="_blank" class="stellarexpert" href="https://stellar.expert/explorer/public/asset/'
            + asset.code + issuer
            + '" >' + asset.code + '<img src="./images/stellar-expert-blue.svg" width="12px" /></a></td>';
        table += '</tr>';

        return table;
    }

    var chartData = [];
    var chartLabels = [];
    if (model.native) {
        let table = await draw({ code: "XLM", issuer: "" }, "./images/stellar-xlm-logo.png", model.native);
        document.getElementById("nativeBalance").innerHTML = table;

        // Chart data
        chartLabels.push("XLM");
        chartData.push(model.native.price);
    }

    let tableOthers = "";
    for (var asset of model.assets) {
        let assetObj = Utils.splitAsset(asset);
        if (assetObj.code != "native") {
            tableOthers += await draw(assetObj, "./images/generic.png", model[asset]);

            // Chart data
            chartLabels.push(assetObj.code);
            chartData.push((model[asset].price));
        }
    }
    document.getElementById("idTableOthers").innerHTML = tableOthers;

    for (var asset of model.assets) {

        var sepIndex = asset.indexOf(':');
        var asset_code = asset.substring(0, sepIndex);
        if (asset_code) {
            var asset_issuer = asset.substring(sepIndex + 1);
            setAssetImage(asset_code, asset_issuer);
        }
    }


    /*
     * Created on
     */
    var createdAt = "Created at " + model.creation.date + ' by ';
    createdAt += '<a href="?accountId=' + model.creation.funder + '" >';
    createdAt += Utils.shortenKey(model.creation.funder);
    createdAt += '</a>';

    divCreation.innerHTML = createdAt;

    if (model.evaluation > 0) {
        /*
         * Chart
         */
        const data = {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Price',
                    data: chartData,
                    cutout: "70%",
                    backgroundColor: [
                        '#7d00ff', // Stellar Violet
                        '#ffa51e', // Stellar Yolk  
                        '#00aa46', // Stellar Moss  
                        '#ff5500', // Stellar Ochre 
                        '#000000', // Stellar Coal  
                        '#e1e1e1', // Stellar Cloud 
                        '#4dc9f6',
                        '#f67019',
                        '#f53794',
                        '#537bc4',
                        '#acc236',
                        '#166a8f',
                        '#00a950',
                        '#58595b',
                        '#8549ba'
                    ]
                }
            ]
        };
        var ctx = 'chart';
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        display: false,
                    },
                    title: {
                        display: true,
                        text: Utils.formatAmount(model.evaluation, 2) + model.native.currency
                    }
                }
            },
        };
        new Chart(ctx, config);
    }
}


function toggleOthers() {
    var div = document.getElementById("idTableOthers");
    var span = document.getElementById("toggle");
    if (div.style.display === "none") {
        div.style.display = "block";
        span.innerHTML = "▼";
    } else {
        div.style.display = "none";
        span.innerHTML = "►";
    }
}


async function findBestPath(asset, amount, destination = 'native') {
    amount = parseFloat(amount).toFixed(7);

    var best = {
        amount: 0,
        path: [],
        asset: {}
    }

    var asset = Utils.splitAsset(asset);

    let type = "native";
    if (asset.code != "native") {
        let data = await Horizon.assets(asset.code, asset.issuer);
        if (data && data._embedded && data._embedded.records && data._embedded.records.length > 0) {
            type = data._embedded.records[0].asset_type;
        }
    }

    try {
        data = await Horizon.strictSend(type, (asset.code == "native") ? undefined : asset.code, asset.issuer, destination, amount);
        if (data && data._embedded && data._embedded.records) {

            // Probably the array is sorted and index 0 is the best
            for (var r of data._embedded.records) {
                if (best.amount < parseFloat(r.destination_amount)) {
                    best = {
                        amount: r.destination_amount,
                        path: r.path,
                        asset: asset
                    };
                }
            }
        }

    } catch (e) {
        console.log(e)
    }

    return best;
}

async function getAveragePrice(fromasset, toasset, duration) {
    // var toasset = Utils.splitAsset(toasset);
    var diff = duration * 3600000;
    var end = new Date().getTime();
    var start = end - diff;

    console.log(start)
    console.log(end)

    let from = {};
    if (fromasset.code != "native") {
        let data = await Horizon.assets(fromasset.code, fromasset.issuer);
        if (data && data._embedded && data._embedded.records && data._embedded.records.length > 0) {
            from = {
                type: data._embedded.records[0].asset_type,
                code: fromasset.code,
                issuer: fromasset.issuer
            };
        }
    } else {
        from = {
            type: "native",
            code: null,
            issuer: null
        };
    }

    let to = {};
    if (toasset.code != "native") {
        let data = await Horizon.assets(toasset.code, toasset.issuer);
        if (data && data._embedded && data._embedded.records && data._embedded.records.length > 0) {
            to = {
                type: data._embedded.records[0].asset_type,
                code: toasset.code,
                issuer: toasset.issuer
            };
        }
    } else {
        to = {
            type: "native",
            code: null,
            issuer: null
        };
    }

    try {
        // response = await fetch("https://horizon.stellar.org/trade_aggregations?base_asset_type=native&counter_asset_code=" + asset.code + "&counter_asset_issuer=" + asset.issuer + "&counter_asset_type=credit_alphanum4&resolution=3600000&start_time=" + start + "&end_time=" + end
        // );
        data = await Horizon.trade_aggregations(from, to, 3600000, start, end);
        console.log(data)

        if (data && data._embedded && data._embedded.records) {
            let agg = [];
            for (var r of data._embedded.records) {
                agg.push({
                    avg: r.avg,
                    code: fromasset.code,
                    issuer: fromasset.issuer
                });
            }
        }
    } catch (e) {
        console.log(e)
    }


    return 0;
}