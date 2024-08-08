import {AlignText} from './constants.js';

export const props = [

  {
    name: 'Money',
    radius: 0.88,
    itemLabelRadius: 0.93,
    itemLabelRotation: 180,
    itemLabelAlign: AlignText.left,
    itemLabelColors: ['#000'],
    itemLabelBaselineOffset: -0.06,
    itemLabelFont: 'Arial',
    itemLabelFontSizeMax: 22,
    lineWidth: 1,
    lineColor: '#000',
    overlayImage: './img/example-3-overlay.svg',
    items: (() => {
      const items = [
      {
        label: '$ 50',
        backgroundColor: '#05ffa1',
      },
      {
        label: '$ 200',
        backgroundColor: '#a67c00',
      },
      {
        label: '$ 1000',
        backgroundColor: '#ffbf00',
        labelColor: '#fff',
      },
      {
        label: '$ 100',
        backgroundColor: '#b1ddff',
      },
      {
        label: '$ 200',
        backgroundColor: '#5f4868',
      },
      {
        label: '$ 500',
        backgroundColor: '#ffcf40',
      },
      {
        label: '$ 100',
        backgroundColor: '#ff0000',
      },
      {
        label: '$ 50',
        backgroundColor: '#2039ba',
      },
      {
        label: '$ 5000',
        backgroundColor: '#000',
        labelColor: '#fff',
      },
      {
        label: '$ 50',
        backgroundColor: '#ce7c56',
      },
      {
        label: '$ 200',
        backgroundColor: '#8dea57',
      },
      {
        label: '$ 500',
        backgroundColor: '#b1ddff',
      },
      {
        label: '$ 100',
        backgroundColor: '#ff9a00',
      },
      {
        label: '$ 200',
        backgroundColor: '#ff7400',
      },
      {
        label: '$ 1000',
        backgroundColor: '#FFFF00',
        labelColor: '#fff',
      },
      {
        label: '$ 100',
        backgroundColor: '#a1484f',
      },
      {
        label: '$ 50',
        backgroundColor: '#9ed670',
      },
      {
        label: '$ 500',
        backgroundColor: '#b1ddff',
      },
    ];

    // Calculate the total amount
    const totalAmount = items.reduce((acc, item) => {
      const amount = Number(item.label.replace('$', '').trim());
      return acc + amount;
    }, 0);

    // Map over the items to set the weight
    return items.map(item => {
      const amount = Number(item.label.replace('$', '').trim());
      return {
        ...item,
        weight: amount / totalAmount,
      };
    });
  })(),
},

  {
    name: 'Basic',
    items: [
      {
        label: 'one',
      },
      {
        label: 'two',
      },
      {
        label: 'three',
      },
    ],
  },

];