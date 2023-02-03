// import React from "react";
// import First from "./first";
// const App = () => <First />;

// export default App;

import React from "react";
import {
  Chart,
  ZoomAndPan,
  ScrollBar,
  ArgumentAxis,
  ValueAxis,
  Title,
  Label,
  Font,
  Legend,
  Series,
  LoadingIndicator
} from "devextreme-react/chart";

const wholeRange = {
  startValue: new Date(2009, 0, 1),
  endValue: new Date(2010, 0, 1)
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.packetsLock = 0;
    this.HALFDAY = 3000;
    this.chartDataSource = {
      store: [],
      sort: "date",
      paginate: false
    };
    this.state = {
      visualRange: {
        startValue: new Date(2009, 0, 1),
        endValue: new Date(2009, 0, 1, 0, 1)
      }
    };
    this.handleChange = this.handleChange.bind(this);
  }
  render() {
    return (
      <Chart
        title="Pickup datetime vs Trip distance"
        id="chart"
        palette="Harmony Light"
        dataSource={this.chartDataSource}
        onOptionChanged={this.handleChange}
      >
        <Series argumentField="time" valueField="distance" />
        <ArgumentAxis
          argumentType="datetime"
          visualRangeUpdateMode="keep"
          visualRange={this.state.visualRange}
          wholeRange={wholeRange}
        />
        <ValueAxis name="trip_distance" allowDecimals={false}>
          <Title text={"Trip distance (Km)"}>
            <Font color="#ff950c" />
          </Title>
          <Label>
            <Font color="#ff950c" />
          </Label>
        </ValueAxis>
        <ScrollBar visible={true} />
        <ZoomAndPan argumentAxis="both" />
        <Legend visible={false} />
        <LoadingIndicator backgroundColor="none">
          <Font size={14} />
        </LoadingIndicator>
      </Chart>
    );
  }
  handleChange(e) {
    if (e.fullName === "argumentAxis.visualRange") {
      const stateStart = this.state.visualRange.startValue;
      const currentStart = e.value.startValue;
      if (stateStart.valueOf() !== currentStart.valueOf()) {
        this.setState({ visualRange: e.value });
      }
      this.onVisualRangeChanged(e.component);
    }
  }

  onVisualRangeChanged(component) {
    const items = component.getDataSource().items();
    const { visualRange } = this.state;
    // if (items) console.log(visualRange.endValue - items[items.length - 1]?.time>= this.HALFDAY);
    if (
      !items.length ||
      items[0].time - visualRange.startValue >= this.HALFDAY ||
      visualRange.endValue - items[items.length - 1].time >= this.HALFDAY
    ) {
      this.uploadDataByVisualRange(component, visualRange);
    }
  }

  uploadDataByVisualRange(component, visualRange) {
    const dataSource = component.getDataSource();
    const storage = dataSource.items();
    // console.log(storage);
    const ajaxArgs = {
      startVisible: getDateString(visualRange.startValue),
      endVisible: getDateString(visualRange.endValue),
      startBound: getDateString(storage.length ? storage[0].date : null),
      endBound: getDateString(
        storage.length ? storage[storage.length - 1].date : null
      )
    };
    const Args = {
      startVisible: visualRange.startValue,
      endVisible: visualRange.endValue
    };

    if (
      ajaxArgs.startVisible !== ajaxArgs.startBound &&
      ajaxArgs.endVisible !== ajaxArgs.endBound &&
      !this.packetsLock
    ) {
      this.packetsLock += 1;
      component.showLoadingIndicator();

      getDataFrame(Args)
        .then((dataFrame) => {
          this.packetsLock -= 1;

          const componentStorage = dataSource.store();
          dataFrame.dataset
            .map((i) => ({
              time: new Date(i[0]),
              distance: i[1]
            }))
            .forEach((item) => componentStorage.insert(item));

          dataSource.reload();

          this.onVisualRangeChanged(component);
        })
        .catch(() => {
          this.packetsLock -= 1;
          dataSource.reload();
        });
    }
  }
}

async function getDataFrame(args) {
  const paramOne = sqlTime(args.startVisible);
  const paramTwo = sqlTime(args.endVisible);
  let url = `https://demo.questdb.io/exec?limit=0,1000&explain=true&count=true&src=con&query=SELECT pickup_datetime,trip_distance FROM trips WHERE pickup_datetime BETWEEN '${paramOne}' AND '${paramTwo}';&timings=true`;
  return fetch(url).then((response) => {
    return response.json();
  });
}

function getDateString(dateTime) {
  return dateTime ? dateTime.toLocaleDateString("en-US") : "";
}

const format = (data) => {
  let len = data?.toString();
  if (len && len.length > 1) return data.toString();
  else return `0${data}`;
};

const sqlTime = (date) => {
  let year = format(date?.getFullYear());
  let month = format(date?.getMonth() + 1);
  let day = format(date?.getDate());
  let hour = format(date?.getHours());
  let minute = format(date?.getMinutes());
  let second = format(date?.getSeconds());
  let sqltime =
    year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second;
  return sqltime;
};

export default App;
