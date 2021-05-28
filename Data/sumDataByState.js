import { descending, max } from 'd3';

//In this function, we accumulate all week data by state for different year
//So it has two fields, and we can create a unique key from them
export const getSumData2 = (data, xValue, yValue) => {
  //  console.log("sumData data: ", data);
  //	console.log("sumData xValue: ", xValue);
  //  console.log(data[1]);

  const o = {}
  const result = data
  .reduce((r, e) => {
    const key = e.YEAR + '|' + yValue(e);
    e.value = xValue(e);
    if (!o[key]) {
      o[key] = e;
      o[key].count = 0;
      r.push(o[key]);
    } else {
      if(e.value >= 0)
      {
      	o[key].value += xValue(e);
        o[key].count ++;
      }
    }
    return r;
  }, [])
  .map(d => {d.avg = d.value/d.count; return d;});
  //No need because of multiple variables
  //.sort((a, b) => descending(a.avg, b.avg));

	//console.log(o)
	//console.log(result)

  return result;
};

export const getSumDataAll = (data, xValue, yValue) => {
  //  console.log("sumData data: ", data);
  //	console.log("sumData xValue: ", xValue);
  //  console.log(data[1]);

  const o = {}
  const result = data
  .reduce((r, e) => {
    const key = yValue(e);
    e.value = xValue(e);
    if (!o[key]) {
      o[key] = e;
      o[key].count = 0;
      r.push(o[key]);
    } else {
      if(e.value >= 0)
      {
      	o[key].value += xValue(e);
        o[key].count ++;
      }
    }
    return r;
  }, [])
  .map(d => {d.avg = d.value/d.count; return d;})
  .sort((a, b) => descending(a.avg, b.avg));

	//console.log(o)
	//console.log(result)

  return result;
};
