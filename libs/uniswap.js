const fetch = require('node-fetch');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const _ = require('lodash');

dayjs.extend(utc);

module.exports = (skip = 0) => {
  const date = dayjs().utc().add(-1, 'd').startOf('d').valueOf() / 1000;
  const query = `query pairs($skip: Int!, $date: Int!) {
    pairDayDatas(
      first: 1000,
      skip: $skip,
      orderBy: dailyVolumeUSD,
      orderDirection: desc,
      where: {
        date: $date
      }
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
  }`;

  return fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2', {
    method: 'POST',
    body: JSON.stringify(
      {
        operationName: 'pairs',
        variables: {
          date,
          skip: skip * 1000,
        },
        query,
      },
    ),
  })
  .then(response => response.json())
  .then((response) => response.data.pairDayDatas.map((pair) => {
    const fee = _.toNumber(pair.dailyVolumeUSD) * (0.3 / 100);
    const liquidity = _.toNumber(pair.reserveUSD);
    const returnOnInvestment = _.defaultTo((fee / liquidity) * 365, 0);

    return {
      ...pair,
      returnOnInvestment,
      token0: pair.token0.symbol,
      token0Address: pair.token0.id,
      token1: pair.token1.symbol,
      token1Address: pair.token1.id,
    }
  }));
};