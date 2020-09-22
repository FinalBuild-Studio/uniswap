const Koa = require('koa');
const helmet = require('koa-helmet');
const compress = require('koa-compress');
const _ = require('lodash');
const uniswap = require('./libs/uniswap');
const app = new Koa();


app
  .use(helmet())
  .use(compress())
  .use(async (ctx) => {
    const uniswapv2 = (skip = 0) => {
      return uniswap(skip).then((pairs) => {
        if (pairs.length >= 1000) {
          return Promise.all([pairs, uniswap(skip + 1)]);
        }

        return pairs;
      })
    };
    const data = await uniswapv2();

    ctx.body = {
      data: _
        .chain(data)
        .flatten()
        .orderBy('returnOnInvestment', 'desc')
        .value(),
    };
  })
  .listen(3000);