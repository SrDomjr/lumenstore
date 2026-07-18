package com.lumenstore.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumenstore.dto.DashboardResponseDTO;
import com.lumenstore.dto.DashboardResponseDTO.DashboardOrderDTO;
import com.lumenstore.dto.DashboardResponseDTO.DashboardPendingReviewDTO;
import com.lumenstore.dto.DashboardResponseDTO.DashboardStockAlertDTO;
import com.lumenstore.models.ProductReview;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.models.Sale;
import com.lumenstore.models.StockAlert;
import com.lumenstore.repository.IClienteRepository;
import com.lumenstore.repository.IProductReviewRepository;
import com.lumenstore.repository.IProductViewRepository;
import com.lumenstore.repository.ISaleRepository;
import com.lumenstore.repository.IStockAlertRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ISaleRepository saleRepository;
    private final IClienteRepository clienteRepository;
    private final IProductReviewRepository productReviewRepository;
    private final IStockAlertRepository stockAlertRepository;
    private final IProductViewRepository productViewRepository;

    private static final DateTimeFormatter CHART_LABEL_FORMAT = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter DTO_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Transactional(readOnly = true)
    public DashboardResponseDTO getDashboardStats() {
        // ─── Sales ──────────────────────────────────────────────
        BigDecimal todaySales = saleRepository.sumTodaySales();
        BigDecimal yesterdaySales = saleRepository.sumYesterdaySales();
        BigDecimal monthSales = saleRepository.sumMonthSales();
        BigDecimal lastMonthSales = saleRepository.sumLastMonthSales();

        String todaySalesTrend = calculateTrend(todaySales.doubleValue(), yesterdaySales.doubleValue());
        String monthSalesTrend = calculateTrend(monthSales.doubleValue(), lastMonthSales.doubleValue());

        // ─── Pending orders ─────────────────────────────────────
        long pendingOrders = saleRepository.countPendingOrders();
        long pendingOrdersYesterday = saleRepository.countPendingOrdersYesterday();
        String pendingOrdersTrend = calculateTrend((double) pendingOrders, (double) pendingOrdersYesterday);

        // ─── New customers ──────────────────────────────────────
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newCustomers = clienteRepository.countByCreatedAtAfter(thirtyDaysAgo);
        long newCustomersYesterday = clienteRepository.countYesterdayNewCustomers();
        String newCustomersTrend = calculateTrend((double) newCustomers, (double) newCustomersYesterday);

        // ─── Conversion rate ────────────────────────────────────
        long todayOrders = saleRepository.countTodayOrders();
        long todayViews = productViewRepository.countTodayViews();

        double conversionRate = todayViews > 0
                ? BigDecimal.valueOf(todayOrders)
                        .divide(BigDecimal.valueOf(todayViews), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue()
                : 0.0;

        long yesterdayOrders = saleRepository.countPendingOrdersYesterday();
        long yesterdayViews = productViewRepository.countYesterdayViews();
        double yesterdayConversion = yesterdayViews > 0
                ? BigDecimal.valueOf(yesterdayOrders)
                        .divide(BigDecimal.valueOf(yesterdayViews), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue()
                : 0.0;
        String conversionTrend = calculateTrend(conversionRate, yesterdayConversion);

        // ─── Revenue chart (last 7 days) ───────────────────────
        List<Object[]> dailyRevenue = saleRepository.getDailyRevenueLast7Days();
        Map<LocalDate, Integer> revenueMap = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            revenueMap.put(today.minusDays(i), 0);
        }
        for (Object[] row : dailyRevenue) {
            LocalDate date = ((java.sql.Date) row[0]).toLocalDate();
            int total = ((BigDecimal) row[1]).intValue();
            revenueMap.put(date, total);
        }
        List<Integer> revenueChart = new ArrayList<>(revenueMap.values());
        List<String> revenueChartLabels = revenueMap.keySet().stream()
                .map(d -> d.format(CHART_LABEL_FORMAT))
                .collect(Collectors.toList());

        // ─── Recent orders ──────────────────────────────────────
        List<Sale> recentSales = saleRepository.findTop5ByOrderByCreatedAtDesc();
        List<DashboardOrderDTO> recentOrders = recentSales.stream()
                .map(this::toOrderDTO)
                .collect(Collectors.toList());

        // ─── Stock alerts ───────────────────────────────────────
        List<StockAlert> alerts = stockAlertRepository.findByIsActiveTrueOrderByVariantId();
        List<DashboardStockAlertDTO> stockAlerts = alerts.stream()
                .filter(alert -> {
                    ProductVariant variant = alert.getVariant();
                    return variant != null && variant.getStock() != null
                            && alert.getThreshold() != null
                            && variant.getStock() <= alert.getThreshold();
                })
                .map(this::toStockAlertDTO)
                .collect(Collectors.toList());

        // ─── Pending reviews ────────────────────────────────────
        List<ProductReview> pendingReviewsList = productReviewRepository.findTop5ByIsApprovedFalseOrderByCreatedAtDesc();
        List<DashboardPendingReviewDTO> pendingReviews = pendingReviewsList.stream()
                .map(this::toPendingReviewDTO)
                .collect(Collectors.toList());

        // ─── Build response ─────────────────────────────────────
        return DashboardResponseDTO.builder()
                .todaySales(todaySales.doubleValue())
                .todaySalesTrend(todaySalesTrend)
                .monthSales(monthSales.doubleValue())
                .monthSalesTrend(monthSalesTrend)
                .pendingOrders((int) pendingOrders)
                .pendingOrdersTrend(pendingOrdersTrend)
                .newCustomers((int) newCustomers)
                .newCustomersTrend(newCustomersTrend)
                .conversionRate(conversionRate)
                .conversionTrend(conversionTrend)
                .revenueChart(revenueChart)
                .revenueChartLabels(revenueChartLabels)
                .recentOrders(recentOrders)
                .stockAlerts(stockAlerts)
                .pendingReviews(pendingReviews)
                .build();
    }

    private String calculateTrend(double current, double previous) {
        if (previous == 0 && current > 0) return "+100%";
        if (previous == 0) return "0%";
        double change = ((current - previous) / previous) * 100;
        return String.format("%+.1f%%", change);
    }

    private DashboardOrderDTO toOrderDTO(Sale sale) {
        String customerName = "";
        if (sale.getCustomer() != null) {
            customerName = (sale.getCustomer().getFirstName() != null ? sale.getCustomer().getFirstName() : "")
                    + " "
                    + (sale.getCustomer().getLastName() != null ? sale.getCustomer().getLastName() : "");
            customerName = customerName.trim();
        }
        return DashboardOrderDTO.builder()
                .id(sale.getId())
                .orderNumber(sale.getOrderNumber())
                .customerName(customerName)
                .status(sale.getStatus() != null ? sale.getStatus().name() : "")
                .total(sale.getTotal() != null ? sale.getTotal().doubleValue() : 0.0)
                .createdAt(sale.getCreatedAt() != null ? sale.getCreatedAt().format(DTO_DATE_FORMAT) : "")
                .build();
    }

    private DashboardStockAlertDTO toStockAlertDTO(StockAlert alert) {
        ProductVariant variant = alert.getVariant();
        String productName = variant != null && variant.getProduct() != null
                ? variant.getProduct().getName()
                : "";
        return DashboardStockAlertDTO.builder()
                .id(alert.getId())
                .productName(productName)
                .variantSku(variant != null ? variant.getSku() : "")
                .currentStock(variant != null && variant.getStock() != null ? variant.getStock() : 0)
                .threshold(alert.getThreshold() != null ? alert.getThreshold() : 0)
                .build();
    }

    private DashboardPendingReviewDTO toPendingReviewDTO(ProductReview review) {
        String customerName = "";
        if (review.getCustomer() != null) {
            customerName = (review.getCustomer().getFirstName() != null ? review.getCustomer().getFirstName() : "")
                    + " "
                    + (review.getCustomer().getLastName() != null ? review.getCustomer().getLastName() : "");
            customerName = customerName.trim();
        }
        return DashboardPendingReviewDTO.builder()
                .id(review.getId())
                .productName(review.getProduct() != null ? review.getProduct().getName() : "")
                .customerName(customerName)
                .rating(review.getRating() != null ? review.getRating() : 0)
                .title(review.getTitle() != null ? review.getTitle() : "")
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().format(DTO_DATE_FORMAT) : "")
                .build();
    }
}
