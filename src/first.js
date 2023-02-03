import React, { useEffect, useState } from "react";
import Chart, {
  ArgumentAxis,
  Legend,
  Series,
  ScrollBar,
  ZoomAndPan,
  ValueAxis,
  Title,
  Font,
  Label,
  LoadingIndicator
} from "devextreme-react/chart";

const First = () => {
  const chartDataSource = {
    store: [],
    sort: "date",
    paginate: false
  };
  const [visualRange, setVisualRange] = useState({
    startValue: new Date(2009, 0, 1),
    endValue: new Date(2009, 0, 1, 0, 1)
  });
  const wholeRange = {
    startValue: new Date(2009, 0, 1),
    endValue: new Date(2009, 0, 3)
  };
  const [packetsLock, setPacketsLock] = useState(0);
  const HALFDAY = 43200000;
  useEffect(() => {
    document
      .querySelector("#chart > svg > rect")
      .addEventListener("scroll", handleChange);
    console.log("ran", visualRange);
  });

  const handleChange = (e) => {
    if (e.fullName === "argumentAxis.visualRange") {
      const stateStart = visualRange.startValue;
      const currentStart = e.value.startValue;
      if (stateStart.valueOf() !== currentStart.valueOf()) {
        setVisualRange(e.value);
      }
      onVisualRangeChanged(e.component);
      // console.log(e);
    }
  };

  const onVisualRangeChanged = (component) => {
    const items = component.getDataSource().items();
    console.log({ items }, { component });
    if (
      !items.length ||
      items[0].date - visualRange.startValue >= HALFDAY ||
      visualRange.endValue - items[items.length - 1].date >= HALFDAY
    ) {
      uploadDataByVisualRange(visualRange, component);
    }
  };

  const uploadDataByVisualRange = (visualRange, component) => {
    const dataSource = component.getDataSource();
    const storage = dataSource.items();
    const ajaxArgs = {
      startVisible: getDateString(visualRange.startValue),
      endVisible: getDateString(visualRange.endValue),
      startBound: getDateString(storage.length ? storage[0].date : null),
      endBound: getDateString(
        storage.length ? storage[storage.length - 1].date : null
      )
    };
    const timeRange = {
      startVisible: sqlTime(visualRange.startValue),
      endVisible: sqlTime(visualRange.endValue)
    };

    if (
      ajaxArgs.startVisible !== ajaxArgs.startBound &&
      ajaxArgs.endVisible !== ajaxArgs.endBound &&
      !packetsLock
    ) {
      setPacketsLock((prev) => prev++);
      component.showLoadingIndicator();

      getDataFrame(timeRange)
        .then((dataFrame) => {
          setPacketsLock((prev) => prev--);

          const componentStorage = dataSource.store();
          // console.log(dataFrame.dataset[0][0]);
          dataFrame.dataset
            .map((i) => ({
              time: new Date(i[0]),
              distance: i[1]
            }))
            .forEach((item) => componentStorage.insert(item));

          dataSource.reload();

          onVisualRangeChanged(component);
        })
        .catch(() => {
          setPacketsLock((prev) => prev--);
          dataSource.reload();
        });
    }
  };

  return (
    <Chart
      title="Pickup datetime vs Trip distance"
      id="chart"
      palette="Harmony Light"
      dataSource={chartDataSource}
      onOptionChanged={handleChange}
    >
      <Series argumentField="time" valueField="distance" />
      <ArgumentAxis
        argumentType="datetime"
        visualRangeUpdateMode="keep"
        visualRange={visualRange}
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
};

const getDateString = (dateTime) => {
  return dateTime ? dateTime.toLocaleDateString("en-US") : "";
};

const getDataFrame = async (args) => {
  let paramOne = args.startVisible;
  let paramTwo = args.endVisible;
  let url = `https://demo.questdb.io/exec?limit=0,100&explain=true&count=true&src=con&query=SELECT pickup_datetime,trip_distance FROM trips WHERE pickup_datetime in ('${paramOne}','${paramTwo}');&timings=true`;
  return fetch(url).then((response) => {
    // console.log(response);
    return response.json();
  });
};
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

export default First;
