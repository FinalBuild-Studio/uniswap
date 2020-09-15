const fetch = require('node-fetch');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const _ = require('lodash');
const Koa = require('koa');
const helmet = require('koa-helmet');
const compress = require('koa-compress');
const app = new Koa();

dayjs.extend(utc);

app
  .use(helmet())
  .use(compress())
  .use(async (ctx) => {
    const date = dayjs().utc().add(-1, 'd').startOf('d').valueOf() / 1000;
    const query = `query pairs($skip: Int!, $date: Int!) {
      pairDayDatas(
        first: 1000,
        skip: $skip,
        orderBy: dailyVolumeUSD,
        orderDirection: desc,
        where: { date: $date }
      ) {
        pairAddress
        reserveUSD
        dailyVolumeUSD
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
    }`
    const uniswapv2 = await fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2', {
      method: 'POST',
      body: JSON.stringify(
        {
          operationName: 'pairs',
          variables: {
            date,
            skip: 0,
          },
          query,
        },
      ),
    })
    .then(response => response.json())
    .then((response) => response.data.pairDayDatas.map((pair) => {
      const returnOnInvestment = ((_.toNumber(pair.dailyVolumeUSD) * (0.3 / 100)) / _.toNumber(pair.reserveUSD)) * 365;

      return {
        ...pair,
        returnOnInvestment: _.defaultTo(returnOnInvestment, 0),
        token0: pair.token0.symbol,
        token0Address: pair.token0.id,
        token1: pair.token1.symbol,
        token1Address: pair.token1.id,
      }
    }))

    ctx.body = {
      data: _.orderBy(uniswapv2, 'returnOnInvestment', 'desc'),
    };
  })
  .listen(3000);