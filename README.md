# binanceMarketMaker


https://github.com/DunnCreativeSS/binanceMarketMaker


https://imgur.com/B8sz2KN


This bot automates making markets on Binance.


Where other market making bots fail (ie. BitMex, Deribit, other attempts I've made in the past) is by counting on the market to not be volatile. Where this bot wins is by finding markets where we can soak up profits in the volatility by taking those profits from the spread itself, where on BitMex and Deribit these spreads ar 0.25$ of a BTC, some smaller markets on Binance have 1%.. 2%... 5% spreads, and greater-than-average volumes.


You'll want to have about $20 per market pair it's looking to trade, in the base asset (BTC, BNB, ETH, etc...). It will look to trade more markets if the targetSpread, targetVolDiv, targetVolMult are higher. The more total funds in a particular base asset there are, the higher value the orders will have. 


If for whatever reason a market pair leaves the universe scope of considered pairs, it will continue selling that asset with the same sell logic (on the quoteAsset+BNB market), while pausing buying it.


I don't have enough personal funds available to run the bot, but I can get a good amount of income if I share it and people use my ref link. targetOrderSizeMult exists so that people can compete using the same bot on the same markets without it just outbidding the other bot constantly, as you can set a % of your order size to ignore when there's a bid or ask better than yours. When the volume that beats your price is higher than the order size * this multiplier, it'll re-enter the market.


To use:


1. (please do) sign up for Binance using my ref link: https://www.binance.com/?ref=27039658


2. Place your Binance API key and secret in binance.js 


3. Optionally change the targetSpread, targetVolDiv, targetVolMult, targetOrderSizeMult


4. Install NPM and Node


5. Clone this repo, cd into directory


6. Run npm i binance-api-node


7. Run node binance.js