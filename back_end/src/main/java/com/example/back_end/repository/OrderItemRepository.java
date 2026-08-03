package com.example.back_end.repository;

import com.example.back_end.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order WHERE oi.course.id IN :courseIds")
    List<OrderItem> findByCourseIdInWithOrder(@Param("courseIds") List<Long> courseIds);

    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.course WHERE oi.order.id = :orderId ORDER BY oi.id ASC")
    List<OrderItem> findByOrderIdWithCourse(@Param("orderId") Long orderId);
}
