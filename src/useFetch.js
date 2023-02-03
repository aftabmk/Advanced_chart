import { useState, useEffect } from "react";
import axios from "axios";

export const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const modifiedData = [];

  useEffect(() => {
    setLoading("loading...");
    setData(null);
    setError(null);
    const source = axios.CancelToken.source();
    axios
      .get(url, { cancelToken: source.token })
      .then((res) => {
        setLoading(false);
        // console.log(res.data.dataset);
        res.data.dataset && setData(res.data.dataset);
      })
      .catch((err) => {
        setLoading(false);
        setError("An error occurred. Awkward..");
      });
    return () => {
      source.cancel();
    };
  }, [url]);
  if (data)
    data.forEach((element) => {
      modifiedData.push({
        // time: element[0],
        time: element[0],
        distance: element[1]
      });
    });
  // console.log(modifiedData);
  return { modifiedData, loading, error };
};
