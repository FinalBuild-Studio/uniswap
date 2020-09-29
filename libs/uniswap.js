const fetch = require('node-fetch');
const dayjs = require('dayjs');
const fs = require('fs');
const utc = require('dayjs/plugin/utc');
const _ = require('lodash');

dayjs.extend(utc);

module.exports = (skip = 0) => {
  const date = dayjs().utc().add(-1, 'd').startOf('d').valueOf() / 1000;
  const query = fs.readFileSync(`${__dirname}/../graphql/pairs`).toString();

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
  .then((response) => {
    const data = _.defaultTo(response.data, {});
    const totalLiquidity = _
      .chain(data)
      .get('uniswapFactory.totalLiquidityUSD')
      .toNumber()
      .value();
    const pairDayDatas = _
      .chain(data)
      .get('pairDayDatas')
      .filter((data) => {
        const liquidityThreshold = totalLiquidity * (0.05 / 100);
        const volume = _.toNumber(data.dailyVolumeUSD);
        const volumeTreshold = totalLiquidity * 0.05;
        const reserveUSD = _.toNumber(data.reserveUSD);

        return reserveUSD >= liquidityThreshold || volume >= volumeTreshold;
      })
      .value();

    return pairDayDatas.map((pair) => {
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
    });
  });
};