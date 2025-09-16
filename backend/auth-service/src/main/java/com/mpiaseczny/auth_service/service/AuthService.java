package com.mpiaseczny.auth_service.service;

import com.mpiaseczny.auth_service.dto.AuthResponse;
import com.mpiaseczny.auth_service.dto.LoginRequest;
import com.mpiaseczny.auth_service.dto.RegisterRequest;
import com.mpiaseczny.auth_service.entity.User;
import com.mpiaseczny.auth_service.repository.UserRepository;
import com.mpiaseczny.auth_service.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        User user = new User(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword())
        );

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername());

        return new AuthResponse(token, savedUser.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        return new AuthResponse(token, user.getUsername());
    }
}
