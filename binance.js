const Binance = require('binance-api-node').default

const client = Binance({
    apiKey: '',
    apiSecret: ''
})

let targetSpread = 0.55;
let targetVolDiv = 5;
let targetVolMult = 200;

const express = require('express');
const app = express();
var request = require("request")
var bodyParser = require('body-parser')

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.set('view engine', 'ejs');

app.listen(process.env.PORT || 8080, function() {});

app.get('/update', (req, res) => {

    doPost(req, res)

})

app.get('/', (req, res) => {
    doPost(req, res)

})
app.post('/', (req, res) => {
    doPost(req, res)

})
let total2 = 0;
let totalbefore = 0;
async function doPost(req, res) {
    console.log(total2)
    let bals2 = {}
    balances = (await client.accountInfo()).balances
    for (var b in balances) {
        bals2[balances[b].asset] = parseFloat(balances[b].free) + parseFloat(balances[b].locked)
    }
    total2 = 0;
    //console.log(bals2)
    for (var bal in bals2) {

        for (var base in bases) {
            if (bal == bases[base]) {
                if (btcs[bal] > 0.00001) {

                    total2 += parseFloat(btcs[bal]) * parseFloat(bals2[bal])
                }
            }
        }
        if (total2 != 0) {}
        for (b in btcs) {
            if (b == bal) {
                if (bals2[b] != 0 && !bases.includes(bal)) {
                    // console.log(parseFloat(bals2[bal]))
                    total2 += parseFloat(bals2[bal]) * parseFloat(btcs[bal] * btcs['BTC'])
                }
            }
        }
    }
    if (totalbefore / total2 == 0 || (totalbefore / total2 < 2 &&  totalbefore / total2 > 0.5)){ 
    
    totalbefore = total2;
    if (req.query.name) {
        res.json({
            total: total2
        });

    } else {
        res.render('index.ejs', {
            name: "",
            json: {},
            avgAsk: {},
            msg: "",
            trades: []
        })
    }
}
}
let ticks = []
let bases = []
let vols = {}
let cs = {}
let tickVols = {}
let spreads = {}
let btcs = {}
client.ws.allTickers(tickers => {
    for (var t in tickers) {
        for (var b in bases) {
            if (tickers[t].symbol == bases[b] + 'BTC') {
                btcs[bases[b]] = tickers[t].bestBid;
            }
        }
        if (tickers[t].symbol == 'BTCUSDT') {
            for (b in btcs) {
                btcs[b] = btcs[b] * tickers[t].bestBid;
            }
            btcs['BTC'] = parseFloat(tickers[t].bestBid);
        }
        let symbol = tickers[t].symbol;
        let asset;
        if (symbol.substring(symbol.length - 3, symbol.length) == 'BTC') {

            asset = symbol.substring(0, symbol.length - 3)



        }
        if (!bases.includes(asset)) {
            btcs[asset] = parseFloat(tickers[t].bestBid)
        }
        let spread = (100 * (1 - parseFloat(tickers[t].bestBid) / parseFloat(tickers[t].bestAsk)))
        if (!ticks.includes(tickers[t].symbol) && spread) {
            spreads[tickers[t].symbol] = spread;
            tickVols[tickers[t].symbol] = (parseFloat(tickers[t].volumeQuote))
            if (tickers[t].symbol.substring(tickers[t].symbol.length - 4, tickers[t].symbol.length).includes('USD')) {
                if (!bases.includes(tickers[t].symbol.substring(tickers[t].symbol.length - 4, tickers[t].symbol.length))) {
                    bases.push(tickers[t].symbol.substring(tickers[t].symbol.length - 4, tickers[t].symbol.length))
                }
            } else {
                if (!bases.includes(tickers[t].symbol.substring(tickers[t].symbol.length - 3, tickers[t].symbol.length))) {
                    bases.push(tickers[t].symbol.substring(tickers[t].symbol.length - 3, tickers[t].symbol.length))
                }
            }
            ticks.push(tickers[t].symbol)
            for (var t in tickers) {
                for (b in bases) {
                    if (vols[bases[b]] == undefined) {
                        vols[bases[b]] = 0;
                        cs[bases[b]] = 0;
                    }
                    if (tickers[t].symbol.substring(tickers[t].symbol.length - 4, tickers[t].symbol.length) == bases[b]) {
                        vols[bases[b]] += (parseFloat(tickers[t].volumeQuote));
                        cs[bases[b]]++;
                    } else if (tickers[t].symbol.substring(tickers[t].symbol.length - 3, tickers[t].symbol.length) == bases[b]) {
                        vols[bases[b]] += (parseFloat(tickers[t].volumeQuote));
                        cs[bases[b]]++;
                    }
                }

            }

        }
    }
})
askOrders = {}
bidOrders = {}
let notabuys = []
let count = 1;
let lala = 0;
let selling = {}
let precisions = {}
let filters = {}
async function cancelAll() {
    try {
        let gos = {}
        let avgs = {}
        for (var v in vols) {
            avgs[v] = vols[v] / cs[v];
        }
        for (var a in avgs) {
            if (a != 'USDS') {
                for (var t in tickVols) {

                    if (t.substring(t.length - 3, t.length) == a) {
                        if (tickVols[t] > avgs[a] / targetVolDiv && tickVols[t] < avgs[a] * targetVolMult && spreads[t] > targetSpread) {
                            if (gos[a] == undefined) {
                                gos[a] = {}
                            }
                            gos[a][(t)] = tickVols[t];
                        }
                    } else if (t.substring(t.length - 4, t.length) == a) {
                        if (tickVols[t] > avgs[a] / targetVolDiv && tickVols[t] < avgs[a] * targetVolMult && spreads[t] > targetSpread) {
                            if (gos[a] == undefined) {
                                gos[a] = {}
                            }
                            gos[a][(t)] = tickVols[t];
                        }
                    }

                }
            }
        }
        let dont = []
        for (var sym in ticks) {

            for (var g in gos) {
                for (var symbol in gos[g]) {
                    if (symbol == sym) {
                        dont.push(symbol)
                    }
                }
            }
        }
        balances = (await client.accountInfo()).balances
        for (var b in balances) {
            bals[balances[b].asset] = parseFloat(balances[b].free)
        }
        for (var bal in bals) {
            let book;
            if (bal != 'BTC' && bal != 'USDS' && bal != 'ETH' && bal != 'BNB' && bals[bal] != 0) {
                if (!bases.includes(bal)) {
                    let symbol = bal + 'BNB';
                    if (true) {
                        try {
                            book = (await client.book({
                                symbol: symbol
                            }))
                        } catch (err) {
                            symbol = bal + 'BTC';
                            try {
                                book = (await client.book({
                                    symbol: symbol
                                }))
                            } catch (err) {
                                symbol = bal + 'ETH';
                                book = (await client.book({
                                    symbol: symbol
                                }))
                            }
                        }
                    }
                    if (!dont.includes(symbol)) {
                        let orders = (await client.openOrders({
                            symbol: symbol,
                        }))

                        for (var o in orders) {
                            console.log(orders[o])
                            console.log('cancel')
                            console.log(await client.cancelOrder({
                                symbol: symbol,
                                orderId: orders[o].orderId,
                            }))


                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
}
cancelAll();
setInterval(function() {
    cancelAll();
}, 60 * 1000 * 4)
async function doit() {
    notabuys = []
    try {
        let exchange = (await client.exchangeInfo())
        for (var symbol in exchange.symbols) {
            precisions[exchange.symbols[symbol].symbol] = {
                'base': exchange.symbols[symbol].baseAsset,
                'quote': exchange.symbols[symbol].quoteAsset,
                'bp': exchange.symbols[symbol].baseAssetPrecision,
                'qp': exchange.symbols[symbol].quotePrecision
            }
            filters[exchange.symbols[symbol].symbol] = {
                'minPrice': parseFloat(exchange.symbols[symbol].filters[0].minPrice),
                'minQty': parseFloat(exchange.symbols[symbol].filters[2].minQty),
                'tickSize': countDecimalPlaces(parseFloat(exchange.symbols[symbol].filters[0].tickSize)),
                'stepSize': countDecimalPlaces(parseFloat(exchange.symbols[symbol].filters[2].stepSize)),
                'minNotional': parseFloat(exchange.symbols[symbol].filters[3].minNotional)
            }
        }
        let balances = (await client.accountInfo()).balances
        for (var b in balances) {
            bals[balances[b].asset] = parseFloat(balances[b].free)
        }
        let gos = {}
        let avgs = {}
        for (var v in vols) {
            avgs[v] = vols[v] / cs[v];
        }
        for (var a in avgs) {
            if (a != 'USDS') {
                for (var t in tickVols) {

                    if (t.substring(t.length - 3, t.length) == a) {
                        if (tickVols[t] > avgs[a] / targetVolDiv && tickVols[t] < avgs[a] * targetVolMult && spreads[t] > targetSpread) {
                            if (gos[a] == undefined) {
                                gos[a] = {}
                            }
                            gos[a][(t)] = tickVols[t];
                        }
                    } else if (t.substring(t.length - 4, t.length) == a) {
                        if (tickVols[t] > avgs[a] / targetVolDiv && tickVols[t] < avgs[a] * targetVolMult && spreads[t] > targetSpread) {
                            if (gos[a] == undefined) {
                                gos[a] = {}
                            }
                            gos[a][(t)] = tickVols[t];
                        }
                    }

                }
            }
        }
        console.log(gos);
        let dont = []
        for (var sym in ticks) {

            for (var g in gos) {
                for (var symbol in gos[g]) {
                    if (symbol == sym) {
                        dont.push(symbol)
                    }
                }
            }
        }

        for (var g in gos) {
            for (var symbol in gos[g]) {
                console.log('2 ' + symbol)
                //testing
                console.log(symbol)
                if (true) { //if (symbol == "GNTBNB"){
                    let book = (await client.book({
                        symbol: symbol
                    }))
                    let hb = 0;
                    let hbless = 0;
                    let laless = 0;
                    for (var bid in book.bids) {
                        if (parseFloat(book.bids[bid].price) > hb) {
                            hbless = hb;
                            hb = parseFloat(book.bids[bid].price);
                        }
                    }
                    let la = 50000000000000000000000;
                    for (var ask in book.asks) {
                        if (parseFloat(book.asks[ask].price) < la) {
                            laless = la;
                            la = parseFloat(book.asks[ask].price)
                        }
                    }
                    //console.log(symbol + ' la: ' + la + ' hb: ' + hb)
                    if (symbol != 'BNBUSDS' && (hblesss[symbol] != hbless || lalesss[symbol] != laless) || (las[symbol] != la && hbs[symbol] != hb)) {
                        hblesss[symbol] = hbless
                        lalesss[symbol] = laless
                        let orders = (await client.openOrders({
                            symbol: symbol,
                        }))

                        for (var o in orders) {
                            console.log(orders[o])
                            console.log('cancel')
                            console.log(await client.cancelOrder({
                                symbol: symbol,
                                orderId: orders[o].orderId,
                            }))


                        }
                        balances = (await client.accountInfo()).balances
                        for (var b in balances) {
                            bals[balances[b].asset] = parseFloat(balances[b].free)
                        }
                        if (symbol.substring(symbol.length - 4, symbol.length) == g) {

                            asset = symbol.substring(0, symbol.length - 4)
                        } else {
                            asset = symbol.substring(0, symbol.length - 3)


                        }
                        console.log('asset: ' + asset)

                        if (bals[asset] != 0) {
                            if (lala == 0) {
                                //console.log(precisions[symbol]);
                                //console.log(filters[symbol])
                                //console.log((bals[symbol.substring(symbol.length - 3, symbol.length)] / (hb * 1.0001)).toFixed(filters[symbol].stepSize - 1));
                                bp = (hb * 1.0001)
                                bp = bp.toFixed(filters[symbol].tickSize - 1)
                                sp = (la * .9999)
                                sp = sp.toFixed(filters[symbol].tickSize - 1)
                                buyQty = ((bals[symbol.substring(symbol.length - 3, symbol.length)] / (hb * 1.0001) / Object.keys(gos[g]).length).toFixed(filters[symbol].stepSize - 1));
                                let dontgo = false;
                                let sellQty = (parseFloat(bals[asset]) * 0.995).toFixed(filters[symbol].stepSize - 1)
                                console.log(sellQty)
                                console.log(filters[symbol].minNotional)
                                if ((sellQty) * hb * 1.0001 < filters[symbol].minNotional) {
                                    console.log('dontgo minnotional ' + symbol)
                                    dontgo = true;
                                }
                                if (sellQty < filters[symbol].minQty) {

                                    console.log('dontgo minqty ' + symbol)
                                    dontgo = true;
                                }
                                //console.log(bp)
                                if (dontgo == false) {

                                    //lala++;
                                    try {
                                        /* buys.push(await client.order({
                  symbol: symbol,
                  side: 'BUY',
                  quantity: buyQty,
                  price: bp,
                })) */
                                        console.log(await client.order({
                                            symbol: symbol,
                                            side: 'SELL',
                                            quantity: sellQty,
                                            price: sp,
                                        }))
                                        console.log(buys);
                                        console.log(sells);
                                    } catch (err) {

                                        console.log(err);
                                    }
                                    las[symbol] = la;
                                    hbs[symbol] = hb;
                                }

                            }

                        }
                    }
                    /*

                     */
                }
            }
        }
        console.log('wololo')
        balances = (await client.accountInfo()).balances
        for (var b in balances) {
            bals[balances[b].asset] = parseFloat(balances[b].free)
        }

        for (var bal in bals) {
            let book;
            if (bal != 'BTC' && bal != 'USDS' && bal != 'ETH' && bal != 'BNB' && bals[bal] != 0) {
                if (!bases.includes(bal)) {
                    let symbol = bal + 'BNB';
                    console.log(symbol)
                    if (true) {
                        console.log(bal)
                        try {
                            book = (await client.book({
                                symbol: symbol
                            }))
                        } catch (err) {
                            symbol = bal + 'BTC';
                            console.log(symbol)
                            try {
                                book = (await client.book({
                                    symbol: symbol
                                }))
                            } catch (err) {
                                symbol = bal + 'ETH';
                                console.log(symbol)
                                book = (await client.book({
                                    symbol: symbol
                                }))
                            }
                        }
                    }
                    console.log(dont);
                    if (!dont.includes(symbol)) {
                        let hb = 0;
                        let hbless = 0;
                        let laless = 0;
                        for (var bid in book.bids) {
                            if (parseFloat(book.bids[bid].price) > hb) {
                                hbless = hb;
                                hb = parseFloat(book.bids[bid].price);
                            }
                        }
                        let la = 50000000000000000000000;
                        for (var ask in book.asks) {
                            if (parseFloat(book.asks[ask].price) < la) {
                                laless = la;
                                la = parseFloat(book.asks[ask].price)
                            }
                        }
                        //console.log(symbol + ' la: ' + la + ' hb: ' + hb)
                        if (symbol != 'BNBUSDS' && (selling[symbol] == false) || ((hblesss[symbol] != hbless || lalesss[symbol] != laless) || (las[symbol] != la && hbs[symbol] != hb))) {
                            selling[symbol] = true;
                            hblesss[symbol] = hbless
                            lalesss[symbol] = laless
                            let orders = (await client.openOrders({
                                symbol: symbol,
                            }))

                            for (var o in orders) {
                                console.log(orders[o])
                                console.log('cancel')
                                console.log(await client.cancelOrder({
                                    symbol: symbol,
                                    orderId: orders[o].orderId,
                                }))


                            }
                            balances = (await client.accountInfo()).balances
                            for (var b in balances) {
                                bals[balances[b].asset] = parseFloat(balances[b].free)
                            }
                            if (symbol.substring(symbol.length - 4, symbol.length) == g) {

                                asset = symbol.substring(0, symbol.length - 4)
                            } else {
                                asset = symbol.substring(0, symbol.length - 3)


                            }
                            console.log('asset: ' + asset)

                            if (bals[asset] != 0) {
                                if (lala == 0) {
                                    //console.log(precisions[symbol]);
                                    //console.log(filters[symbol])
                                    //console.log((bals[symbol.substring(symbol.length - 3, symbol.length)] / (hb * 1.0001)).toFixed(filters[symbol].stepSize - 1));
                                    bp = (hb * 1.0001)
                                    bp = bp.toFixed(filters[symbol].tickSize - 1)
                                    sp = (la * .9999)
                                    sp = sp.toFixed(filters[symbol].tickSize - 1)
                                    buyQty = ((bals[symbol.substring(symbol.length - 3, symbol.length)] / (hb * 1.0001) / Object.keys(gos[g]).length).toFixed(filters[symbol].stepSize - 1));
                                    let dontgo = false;
                                    let sellQty = (parseFloat(bals[asset]) * 0.995).toFixed(filters[symbol].stepSize - 1)
                                    console.log(sellQty)
                                    console.log(filters[symbol].minNotional)
                                    if ((sellQty) * hb * 1.0001 < filters[symbol].minNotional) {
                                        console.log('dontgo minnotional ' + symbol)
                                        dontgo = true;
                                    }
                                    if (sellQty < filters[symbol].minQty) {

                                        console.log('dontgo minqty ' + symbol)
                                        dontgo = true;
                                    }
                                    //console.log(buyQty)
                                    //console.log(bp)
                                    if (dontgo == false) {

                                        //lala++;
                                        try {
                                            /* buys.push(await client.order({
                  symbol: symbol,
                  side: 'BUY',
                  quantity: buyQty,
                  price: bp,
                })) */

                                            las[symbol] = la;
                                            hbs[symbol] = hb;
                                            notabuys.push(symbol)
                                            console.log(await client.order({
                                                symbol: symbol,
                                                side: 'SELL',
                                                quantity: sellQty,
                                                price: sp,
                                            }))
                                            console.log(buys);
                                            console.log(sells);
                                        } catch (err) {

                                            console.log(err);
                                        }
                                    }

                                }

                            }
                        }
                    }
                }
                /*

                 */
            }
        }
        //  }
        for (var g in gos) {
            for (var symbol in gos[g]) {
                console.log('1 ' + symbol)
                //testing
                if (true) { //if (symbol == "GNTBNB"){
                    let book = (await client.book({
                        symbol: symbol
                    }))
                    let hb = 0;
                    let laless = 0;
                    let hbless = 0;
                    let bsover = 0;
                    let asover = 0;
                    for (var bid in book.bids) {
                        if (parseFloat(book.bids[bid].price) > hb) {
                            hbless = hb
                            hb = parseFloat(book.bids[bid].price);
                        }
                        if (parseFloat(book.bids[bid].price) > borders[symbol]) {
                            bsover += parseFloat(book.bids[bid].quantity);
                        }
                    }
                    let la = 50000000000000000000000;
                    for (var ask in book.asks) {
                        if (parseFloat(book.asks[ask].price) < la) {
                            laless = la
                            la = parseFloat(book.asks[ask].price)
                        }
                        if (parseFloat(book.asks[ask].price) < aorders[symbol]) {
                            asover += parseFloat(book.asks[ask].quantity);
                        }
                    }

                    console.log(symbol + ' la: ' + la + ' hb: ' + hb)
                    console.log(aorders[symbol])
                    if (symbol != 'BNBUSDS' && !notabuys.includes(symbol) && ((hblesss[symbol] != hbless || lalesss[symbol] != laless) || ((las[symbol] != la && hbs[symbol] != hb) && (aorders[symbol] != la && borders[symbol] != hb)))) {
                        console.log(buyQtys[symbol] + ' ; ' + bsover);
                        if (buyQtys[symbol] * 1.5 < bsover || buyQtys[symbol] == undefined) {
                            hblesss[symbol] = hbless;
                            lalesss[symbol] = laless;
                            if (symbol.substring(symbol.length - 4, symbol.length) == g) {

                                asset = symbol.substring(0, symbol.length - 4)
                            } else {
                                asset = symbol.substring(0, symbol.length - 3)

                                //console.log('asset: ' + asset)
                            } //console.log('asset: ' + asset)
                            let orders = (await client.openOrders({
                                symbol: symbol,
                            }))

                            for (var o in orders) {
                                console.log(orders[o])
                                console.log('cancel')
                                console.log(await client.cancelOrder({
                                    symbol: symbol,
                                    orderId: orders[o].orderId,
                                }))

                            }
                            balances = (await client.accountInfo()).balances
                            for (var b in balances) {
                                bals[balances[b].asset] = parseFloat(balances[b].free)
                            }
                            if (lala == 0) {
                                //console.log(precisions[symbol]);
                                //console.log(filters[symbol])
                                //console.log((bals[symbol.substring(symbol.length - 3, symbol.length)] / (hb * 1.0001) / Object.keys(gos[g]).length).toFixed(filters[symbol].stepSize - 1));
                                bp = (hb * 1.0001)
                                bp = bp.toFixed(filters[symbol].tickSize - 1)
                                sp = (la * .9999)
                                sp = sp.toFixed(filters[symbol].tickSize - 1)
                                //buyQty = ((bals[symbol.substring(symbol.length - 3, symbol.length)] / (hb * 1.0001) / Object.keys(gos[g]).length).toFixed(filters[symbol].stepSize - 1));
                                //testing
                                buyQty = ((bals[symbol.substring(symbol.length - 3, symbol.length)] * 0.99 / (hb * 1.0001) / Object.keys(gos[g]).length).toFixed(filters[symbol].stepSize - 1));
                                console.log('buyQty: ' + buyQty)
                                let dontgo = false;
                                //console.log(buyQty)
                                //console.log(bp)
                                /*if (hb == bp){
                                    console.log('dontgo buy = ask');
                                    dontgo = true;
                                }*/
                                if (buyQty > 1500) {
                                    console.log('dontgo minOrder ' + symbol)
                                    dontgo = true;
                                }
                                if ((buyQty * hb * 1.0001) < filters[symbol].minNotional) {
                                    console.log('dontgo minnotional ' + symbol)
                                    dontgo = true;
                                }
                                if (buyQty < filters[symbol].minQty) {

                                    console.log('dontgo minqty ' + symbol)
                                    dontgo = true;
                                }
                                if (dontgo == false && buyQty > 0.00001) {

                                    //lala++;
                                    try {
                                        buyQtys[symbol] = buyQty;
                                        aorders[symbol] = la;
                                        selling[symbol] = true;
                                        borders[symbol] = hb;
                                        console.log(await client.order({
                                            symbol: symbol,
                                            side: 'BUY',
                                            quantity: buyQty,
                                            price: bp,
                                        }))
                                        /*
                console.log(await client.order({
                  symbol: symbol,
                  side: 'SELL',
                  quantity: bals[asset],
                  price: sp,
                })) */
                                        console.log(buys);
                                        console.log(sells);
                                    } catch (err) {

                                        console.log(err);
                                    }
                                }
                            }


                            las[symbol] = la;
                            hbs[symbol] = hb;
                        }
                        /*

                         */
                    }
                }
            }
        }

        console.log(count * 1 + ' intervals')
        setTimeout(function() {
            doit();
        }, 60000)
        count++;
    } catch (err) {
        setTimeout(function() {
            doit();
        }, 60000)
        console.log(err);
    }
}
setTimeout(function() {
    doit();
}, 15000)
let bals = {}

function countDecimalPlaces(number) {
    var str = "" + number;
    if (str == '1e-7') {
        str = "0.0000001"
    } else {

        if (str == '1e-8') {
            str = "0.00000001"
        }
        var index = str.indexOf('.');


    }
    if (index >= 0) {
        return str.length - index;
    } else {
        return 1;
    }
}
let buys = []
let sells = []
let las = {}
let hbs = {}
let aorders = {}
let borders = {}
let buyQtys = {}
let lalesss = {};
let hblesss = {};