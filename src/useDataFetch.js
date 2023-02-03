import { useState, useEffect } from "react";
import axios from "axios";

export const useDataFetch = (e) => {
  const [visualRange, setVisualRange] = useState({
    startValue: new Date(2009, 1, 1),
    endValue: new Date(2009, 1, 15)
  });
  const [misc, setMisc] = useState({
    HALFDAY: 43200000,
    packetsLock: 0
  });
  const [store, setStore] = useState({
    store: [],
    sort: "date",
    paginate: false
  });

  const onVisualRangeChanged = (component) => {
    const items = component.getDataSource().items();
    if (
      !items.length ||
      items[0].date - visualRange.startValue >= misc.HALFDAY ||
      visualRange.endValue - items[items.length - 1].date >= this.HALFDAY
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

    if (
      ajaxArgs.startVisible !== ajaxArgs.startBound &&
      ajaxArgs.endVisible !== ajaxArgs.endBound &&
      !misc.packetsLock
    ) {
      setMisc(misc.packetsLock++);
      component.showLoadingIndicator();

      getDataFrame(ajaxArgs)
        .then((dataFrame) => {
          setMisc(misc.packetsLock--);

          const componentStorage = dataSource.store();

          dataFrame
            .map((i) => ({
              date: new Date(i.Date),
              minTemp: i.MinTemp,
              maxTemp: i.MaxTemp
            }))
            .forEach((item) => componentStorage.insert(item));

          dataSource.reload();

          onVisualRangeChanged(component);
        })
        .catch(() => {
          setMisc(misc.packetsLock--);
          dataSource.reload();
        });
    }
  };

  const getDataFrame = (args) => {
    let params = "?";

    params += `startVisible=${args.startVisible}
      &endVisible=${args.endVisible}
      &startBound=${args.startBound}
      &endBound=${args.endBound}`;

    return fetch(
      `https://demo.questdb.io/exec?limit=0,100&explain=true&count=true&src=con&query=SELECT dropoff_datetime as time,trip_distance as distance FROM 'trips',LIMIT 0,100&timings=true`
    ).then((response) => {
      console.log(response);
      return response.json();
    });
  };

  const getDateString = (dateTime) => {
    return dateTime ? dateTime.toLocaleDateString("en-US") : "";
  };

  if (e.fullName === "valueAxis[0].visualRange") {
    const stateStart = visualRange.startValue;
    const currentStart = e.value.startValue;
    if (stateStart.valueOf()) {
      setVisualRange({ ...visualRange, startValue: currentStart });
    }
    onVisualRangeChanged(e.component);

    return { visualRange };
  }
};
