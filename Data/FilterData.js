export const getFilteredData = (data, yearId) => {
  return data
    .filter(d => yearId !== null ? d['Year'] === yearId : d)
    .filter(d => d.State !== 'Florida')
    .filter(d => d.State !== 'Puerto Rico')
    .filter(d => d.State !== 'Virgin Islands')
    .filter(d => d.State !== 'District of Columbia')
    .filter(d => d.State !== 'Commonwealth of the Northern Mariana Islands');
};

export const getState2ValueMap = (data, stateToValue) => {
  const state2Value = new Map();
  
  data.forEach(d => {
    state2Value.set(d.State, stateToValue(d));
  });
  return state2Value;
};

export const getTopNStatesFlag = (data, topNStatesData) => {
  const top10States = {};
  
  topNStatesData.forEach(d => (top10States[d.State] = true));
  const top10Data = data.filter(d => top10States[d['State']]);
  return top10Data;
};