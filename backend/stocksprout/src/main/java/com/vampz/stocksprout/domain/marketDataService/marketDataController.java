package com.vampz.stocksprout.domain.marketDataService;
import com.vampz.stocksprout.domain.marketDataService.StockCurrentDTO;
import com.vampz.stocksprout.domain.watchMVC.WatchItem;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/api/marketData")
public class marketDataController {

    private final marketDataService marketDataService;

    public marketDataController(marketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping(path = "/currentStockPrice")
    public StockCurrentDTO getCurrentStockPrice(@RequestParam String symbol) {
        return marketDataService.getCurrentStockPrice(symbol);

    }



    @GetMapping(path = "/StockPriceHistory")
    public List<StockHistDTO> getStockPriceHistory(
            @RequestParam String symbol,
            @RequestParam String startDate,
            @RequestParam String endDate
            ) {
        return marketDataService.getStockPriceHistory(symbol, startDate, endDate);

    }

    @GetMapping(path = "/stockData")
    public WatchItem getStockData(@RequestParam String symbol) {
        return marketDataService.getStockData(symbol);
    }




}
