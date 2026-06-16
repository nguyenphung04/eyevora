package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.eyevora.backend.dto.DashboardResponse;
import vn.eyevora.backend.service.DashboardService;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin("*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<DashboardResponse> getOverview() {
        return ResponseEntity.ok(dashboardService.getDashboardOverview());
    }
    @GetMapping("/export-excel")
    public ResponseEntity<java.util.Map<String, Object>> exportExcelData() {
        return ResponseEntity.ok(dashboardService.getExportData());
    }
}