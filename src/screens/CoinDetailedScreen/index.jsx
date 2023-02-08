import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import CoinDetailedHeader from "./components/CoinDetailedHeader";
import styles from "./styles";
import { AntDesign } from "@expo/vector-icons";
// import { LineChart, CandlestickChart } from "react-native-wagmi-charts";
import { LineChart } from "react-native-chart-kit";
import millify from "millify";
import { useRoute } from "@react-navigation/native";
import {
  getDetailedCoinData,
  getCoinMarketChart,
  getCandleChartData,
} from "../../services/requests";
import FilterComponent from "./components/FilterComponent";
import { MaterialIcons } from "@expo/vector-icons";

const filterDaysArray = [
  { filterDay: "1", filterText: "24h" },
  { filterDay: "7", filterText: "7d" },
  { filterDay: "30", filterText: "30d" },
  { filterDay: "365", filterText: "1y" },
  { filterDay: "max", filterText: "All" },
];

const CoinDetailedScreen = () => {
  const [coin, setCoin] = useState(null);
  const [coinMarketData, setCoinMarketData] = useState(null);
  const [coinCandleChartData, setCoinCandleChartData] = useState(null);
  const route = useRoute();
  const {
    params: { coinId },
  } = route;

  const [loading, setLoading] = useState(false);
  const [coinValue, setCoinValue] = useState("1");
  const [usdValue, setUsdValue] = useState("");
  const [selectedRange, setSelectedRange] = useState("1");
  const [isCandleChartVisible, setIsCandleChartVisible] = useState(false);

  const fetchCoinData = async () => {
    setLoading(true);
    const fetchedCoinData = await getDetailedCoinData(coinId);
    setCoin(fetchedCoinData);
    setUsdValue(fetchedCoinData.market_data.current_price.usd.toString());
    setLoading(false);
  };

  const fetchMarketCoinData = async (selectedRangeValue) => {
    const fetchedCoinMarketData = await getCoinMarketChart(
      coinId,
      selectedRangeValue
    );
    setCoinMarketData(fetchedCoinMarketData);
  };

  const fetchCandleStickChartData = async (selectedRangeValue) => {
    const fetchedSelectedCandleChartData = await getCandleChartData(
      coinId,
      selectedRangeValue
    );
    setCoinCandleChartData(fetchedSelectedCandleChartData);
  };

  useEffect(() => {
    fetchCoinData();
    fetchMarketCoinData(1);
    fetchCandleStickChartData();
  }, []);

  const onSelectedRangeChange = (selectedRangeValue) => {
    setSelectedRange(selectedRangeValue);
    fetchMarketCoinData(selectedRangeValue);
    fetchCandleStickChartData(selectedRangeValue);
  };

  const memoOnSelectedRangeChange = React.useCallback(
    (range) => onSelectedRangeChange(range),
    []
  );

  if (loading || !coin || !coinMarketData || !coinCandleChartData) {
    return <ActivityIndicator size="large" />;
  }

  const {
    id,
    image: { small },
    name,
    symbol,
    market_data: {
      market_cap_rank,
      current_price,
      price_change_percentage_24h,
    },
    description: { en },
  } = coin;

  const { prices } = coinMarketData;

  const lineTimestamps = prices.map(
    ([timestamp, value]) => new Date(timestamp)
  );

  const formatCurrency = (value) => {
    "worklet";
    if (value === "") {
      if (current_price.usd < 1) {
        return `${current_price.usd}`;
      }
      return `${current_price.usd.toFixed(2)}`;
    } else if (current_price.usd < 1) {
      return `${parseFloat(value)}`;
    } else if (current_price.usd > 1000) return `${millify(value)}`;
    else return value;
  };

  let lineValues = prices.map(([timestamp, value]) => value);

  console.log(lineValues);

  const changeCoinValue = (value) => {
    setCoinValue(value);
    const floatValue = parseFloat(value.replace(",", ".")) || 0;
    setUsdValue((floatValue * current_price.usd).toString());
  };

  const changeUsdValue = (value) => {
    setUsdValue(value);
    const floatValue = parseFloat(value.replace(",", ".")) || 0;
    setCoinValue((floatValue / current_price.usd).toString());
  };

  return (
    <ScrollView style={{ paddingHorizontal: 10 }}>
      <CoinDetailedHeader
        coinId={id}
        image={small}
        symbol={symbol}
        marketCapRank={market_cap_rank}
      />
      <View style={styles.priceContainer}>
        <View>
          <Text style={styles.name}>{name}</Text>
        </View>
        <View
          style={{
            paddingHorizontal: 3,
            paddingVertical: 8,
            borderRadius: 5,
            flexDirection: "row",
          }}
        >
          <AntDesign
            name={price_change_percentage_24h < 0 ? "caretdown" : "caretup"}
            size={12}
            color={"white"}
            style={{ alignSelf: "center", marginRight: 5 }}
          />
          <Text style={styles.priceChange}>
            {price_change_percentage_24h?.toFixed(2)}%
          </Text>
        </View>
      </View>
      <View style={styles.filtersContainer}>
        {filterDaysArray.map((day) => (
          <FilterComponent
            filterDay={day.filterDay}
            filterText={day.filterText}
            selectedRange={selectedRange}
            setSelectedRange={memoOnSelectedRangeChange}
            key={day.filterText}
          />
        ))}
      </View>

      <View>
        <LineChart
          data={{
            labels: lineTimestamps,
            datasets: [
              {
                data: lineValues,
              },
            ],
          }}
          width={Dimensions.get("window").width * 0.95} // from react-native
          height={320}
          paddingLeft={"15"}
          paddingRight={"15"}
          paddingTop={"15"}
          paddingBottom={"0"}
          yAxisLabel="$"
          yAxisInterval={3} // optional, defaults to 1
          withVerticalLabels={false}
          formatYLabel={formatCurrency}
          hidePointsAtIndex={Array.from({ length: 1000 }, (v, k) =>
            k % 2 === 0 ? k : null
          )}
          chartConfig={{
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "2",
              strokeWidth: "5",
              stroke: "#ffa726",
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", marginTop: 16 }}>
        <View style={styles.tickerContainer}>
          <Image source={{ uri: small }} style={{ width: 25, height: 25 }} />
          <Text style={styles.tickerTitle}>{symbol.toUpperCase()}</Text>
        </View>
        <Text style={styles.tickerTitle}>Converter</Text>
      </View>

      <View style={{ flexDirection: "row" }}>
        <View style={{ flexDirection: "row", flex: 1 }}>
          <Text style={{ color: "white", alignSelf: "center" }}>
            {symbol.toUpperCase()}
          </Text>
          <TextInput
            style={styles.input}
            value={coinValue}
            keyboardType="numeric"
            onChangeText={changeCoinValue}
          />
        </View>

        <View style={{ flexDirection: "row", flex: 1 }}>
          <Text style={{ color: "white", alignSelf: "center" }}>USD</Text>
          <TextInput
            style={styles.input}
            value={usdValue}
            keyboardType="numeric"
            onChangeText={changeUsdValue}
          />
        </View>
      </View>

      <View>
        <View style={{ color: "white", marginTop: 30 }}>
          {en ? (
            <>
              <View style={{ flexDirection: "row", marginTop: 16 }}>
                <View style={styles.tickerContainer}>
                  <Image
                    source={{ uri: small }}
                    style={{ width: 25, height: 25 }}
                  />
                  <Text style={styles.tickerTitle}>{symbol.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.tickerTitle}>Description</Text>
              <Text style={{ color: "white" }}>{en}</Text>
            </>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

export default CoinDetailedScreen;
