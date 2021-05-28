export const ValueAttributes = [
  { value: 'ILI_Percent', label: 'Fertility rate' },
  { value: 'ILI_Total', label: 'Education' },
  { value: 'Providers', label: 'Policy' },
  { value: 'Pat_Total', label: 'Family Planning' }
];

export const FieldAttributes = [
  { value: 'State', label: 'State' },
  { value: 'Year', label: 'Year' },
  { value: 'Week', label: 'Week of the Year' }
];

export const getLabel = (value, attributes) => {
  for (let i = 0; i < attributes.length; i++) {
    if (attributes[i].value === value) {
      return attributes[i].label;
    }
  }
};

export const NumOfStates = [
  { value: '10', label: '10' },
  { value: '7', label: '7' },
  { value: '5', label: '5' },
  { value: '3', label: '3' }
];

export const Group5Color = [
  '#e41a1c',
  '#377eb8',
  '#4daf4a',
  '#984ea3',
  '#ff7f00'
];

export const Group10Color = [
  '#f42a0c',
  '#062ec3',
  '#ff7f00',
  '#4d9f4a',
  '#984ea3',
  '#f7298a',
  '#37aeb8',
  '#d95f02',
  '#66c60e',
  '#fb7a89'
];
