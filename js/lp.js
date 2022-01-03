
const urlParams = new URLSearchParams(window.location.search);
let accountId = urlParams.get('accountId');
if (accountId) {
    fieldPubKey.value = accountId;
    loadAccount(accountId);

    var menu = document.getElementsByClassName("menu");
    for (var m of menu) {
        m.href += "?accountId=" + accountId;
    }
}

async function loadAccount(pubKey) {
    let loading = document.getElementById("loading");
    loading.innerHTML = "Loading...";

    let start = new Date();
    if (validateAccount(pubKey)) {
        await loadLiquidityPools(pubKey);
    }
    loading.innerHTML = "";
    let end = new Date();

    console.log("Loading time: " + ((end - start) / 1000));
}

async function loadLiquidityPools(pubKey) {

    /*
    * Liquidity Pools
    */


    let data = await Horizon.accounts(pubKey);

    var model = {
        pools: []
    };

    if (data.balances) {
        var promises = [];
        for (var b of data.balances) {
            if (b.asset_type == "liquidity_pool_shares") {

                var lp = await Horizon.liquidityPools(b.liquidity_pool_id);
                model.pools.push(lp.id);
                model[lp.id] = {
                    balance: b.balance,
                    // shares: lp.total_shares,
                    // members: lp.total_trustlines,
                    // reserves: lp.reserves,
                    share: [
                        {
                            asset: lp.reserves[0].asset,
                            amount: (b.balance * lp.reserves[0].amount / lp.total_shares).toFixed(7)
                        },
                        {
                            asset: lp.reserves[1].asset,
                            amount: (b.balance * lp.reserves[1].amount / lp.total_shares).toFixed(7)
                        }
                    ]
                };

            }
        }

        drawLiquidityPool(model);
    } else {
        if (data.status && data.status == 404) {
            document.getElementById("creation").innerHTML = "Account not found";
        } else {

            console.log(data)
        }
    }
}


async function drawLiquidityPool(model) {

    // if (model.native) {
    //     let table = await draw({ code: "XLM", issuer: "" }, "./images/stellar-xlm-logo.png", model.native);
    //     document.getElementById("nativeBalance").innerHTML = table;

    //     // Chart data
    //     chartLabels.push("XLM");
    //     chartData.push(model.native.price);
    // }

    const defaultImage = "./images/generic.png";
    let table = "";
    let assets = [];
    for (var poolid of model.pools) {
        let pool = model[poolid];
        let amount1 = pool.share[0].amount;
        let amount2 = pool.share[1].amount;
        if (!assets.includes(pool.share[0].asset)) {
            assets.push(pool.share[0].asset);
        }
        if (!assets.includes(pool.share[1].asset)) {
            assets.push(pool.share[1].asset);
        }
        let asset1 = Utils.splitAsset(pool.share[0].asset);
        let asset2 = Utils.splitAsset(pool.share[1].asset);
        let label1 = (asset1.code == "native")?"XLM":asset1.code;
        let label2 = (asset2.code == "native")?"XLM":asset2.code;

        table += '<div class="tablerow" style="text-align:left;vertical-align: middle;">';
        table += '<div class="tablecell" style="text-align:left;vertical-align: middle;">';
        table += '  <table class="lp" >';
        table += '    <tr>';
        table += '      <td style="text-align: right;min-width:10em;">';
        table += '        ' + Utils.formatAmount(amount1);
        table += '      </td>';
        table += '      <td rowspan="2" style="text-align: right;" >';
        table += '        <img class="asset-img ' + asset1.code + ':' + asset1.issuer + '"  src="' + defaultImage + '" />';
        table += '      </td>';
        table += '      <td rowspan="2">';
        table += '        <img class="asset-img ' + asset2.code + ':' + asset2.issuer + '"  src="' + defaultImage + '" />';
        table += '      </td>';
        table += '      <td style="text-align: left;min-width:10em;">';
        table += '        ' + Utils.formatAmount(amount2);
        table += '      </td>';
        // table += '      <td rowspan="3"> ';
        // table += '<canvas style="width: 80%;text-align: right;"  id="chart' + poolid + '"></canvas> ';
        // table += '      </td>';
        table += '    </tr>';
    
        table += '    <tr>';
        table += '      <td class="lighter" style="text-align: right;">' + label1 + '</td>';
        table += '      <td class="lighter">' + label2 + '</td>';
        // table += '      <td class="lighter">' + label2 + '</td>';
        table += '    </tr>';
        table += '  </table>';
        table += '</div>';
        table += '<div class="chart-container tablecell" > <canvas style="width: 50%;text-align: right;"  id="chart' + poolid + '"></canvas> </div>';
        table += '</div>';


    }
    document.getElementById('pools').innerHTML = table;

    for (var asset of assets) {

        var a = Utils.splitAsset(asset);
        if (a.code) {
            setAssetImage(a.code, a.issuer);
        }
    }


    for (var poolid of model.pools) {
        let pool = model[poolid];
        let amount1 = pool.share[0].amount;
        let amount2 = pool.share[1].amount;
        let asset1 = Utils.splitAsset(pool.share[0].asset);
        let asset2 = Utils.splitAsset(pool.share[1].asset);
        let label1 = (asset1.code == "native")?"XLM":asset1.code;
        let label2 = (asset2.code == "native")?"XLM":asset2.code;

        var chartData = [amount1, amount2];
        var chartLabels = [label1, label2];

        const data = {
            labels: chartLabels,
            datasets: [
                {
                    // label: 'Price',
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
        var ctx = 'chart' + poolid;
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
                        text: label1 + '/' + label2
                    }
                }
            },
        };
        new Chart(ctx, config);
    }

}