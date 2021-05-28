import { descending } from 'd3';

//This function returns the summary of the top 10 data for bar chart
export const getTopNStateData = (data, xValue, topStateNum=10) => {

  const stateCounts = {};
  const stateTotals = {};
  const stateSummary = {};

  const stateTotalWeekly = data
    .filter(d => xValue(d) !== 'X')
//    .filter(d => d['YEAR'] === '2018')
    .map(d => {
      d.value = xValue(d);
      if (d.value) {
        if (!stateTotals[d['REGION']]) {
          stateTotals[d['REGION']] = 0;
          stateCounts[d['REGION']] = 0;
        }
        stateTotals[d['REGION']] += d.value;
        stateCounts[d['REGION']]++;
      }
      return d;
    });
  // console.log(stateTotalWeekly);
  // console.log(stateTotals);
  // console.log(stateCounts);

  const topStates = {};

  const topData = data.filter(d => topStates[d['State']]);
//  console.log(topData);

  const array1 = Object.values(stateTotals);
  const array2 = Object.values(stateCounts);
  const array3 = Object.keys(stateTotals).map((state, i) => {
    return { state: state,
       total: array1[i],
       count: array2[i],
       avg: array1[i]/array2[i] };
  });

//  console.log(array3);

  const array4 = array3
    .sort((a, b) => descending(a.avg, b.avg))
    .slice(0, topStateNum);
  
  array4.forEach(d => (topStates[d.state] = true));

  //top 10 States filled!
  // console.log(topStates);
  // console.log(array4);

  const top10BarData = array4
    .map((d) => ({ State: d.state, Tvalue: d.avg }))
  return top10BarData;
};
