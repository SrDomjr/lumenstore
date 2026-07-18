package com.lumenstore.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponseDTO {
    private double todaySales;
    private String todaySalesTrend;
    private double monthSales;
    private String monthSalesTrend;
    private int pendingOrders;
    private String pendingOrdersTrend;
    private int newCustomers;
    private String newCustomersTrend;
    private double conversionRate;
    private String conversionTrend;
    private List<Integer> revenueChart;
    private List<String> revenueChartLabels;
    private List<DashboardOrderDTO> recentOrders;
    private List<DashboardStockAlertDTO> stockAlerts;
    private List<DashboardPendingReviewDTO> pendingReviews;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardOrderDTO {
        private Long id;
        private String orderNumber;
        private String customerName;
        private String status;
        private double total;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardStockAlertDTO {
        private Long id;
        private String productName;
        private String variantSku;
        private int currentStock;
        private int threshold;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardPendingReviewDTO {
        private Long id;
        private String productName;
        private String customerName;
        private byte rating;
        private String title;
        private String createdAt;
    }
}
