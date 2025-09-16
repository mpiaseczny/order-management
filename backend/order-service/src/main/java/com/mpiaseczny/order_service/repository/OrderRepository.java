package com.mpiaseczny.order_service.repository;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import com.mpiaseczny.order_service.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);

    List<Order> findByCreatedByIdAndStatusInOrderByCreatedAtDesc(Long createdById, List<OrderStatus> statuses);
}
