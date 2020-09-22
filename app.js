const Koa = require('koa');
const helmet = require('koa-helmet');
const compress = require('koa-compress');
const _ = require('lodash');
const uniswap = require('./libs/uniswap');
const Cache = require('node-cache');
const cache = new Cache({ stdTTL: 43200 });
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
    const data = cache.get('data') || await uniswapv2();

    // cache data
    cache.set('data', data);

    // sort response
    const response = _
        .chain(data)
        .flatten()
        .orderBy('returnOnInvestment', 'desc')
        .value();

    ctx.body = {
      data: response,
    };
  })
  .listen(3000);