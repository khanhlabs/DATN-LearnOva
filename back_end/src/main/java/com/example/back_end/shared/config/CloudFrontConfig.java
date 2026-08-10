package com.example.back_end.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

@Configuration
public class CloudFrontConfig {

    @Value("${cloudfront.private-key-path:}")
    private String privateKeyPath;

    @Bean
    public CloudFrontUtilities cloudFrontUtilities() {
        return CloudFrontUtilities.create();
    }

    @Bean
    @ConditionalOnExpression("!'${cloudfront.private-key-path:}'.isEmpty()")
    public PrivateKey cloudFrontPrivateKey() throws IOException, GeneralSecurityException {
        String pem = Files.readString(Path.of(privateKeyPath));
        String normalized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(normalized);
        if (pem.contains("BEGIN RSA PRIVATE KEY")) {
            keyBytes = convertPkcs1ToPkcs8(keyBytes);
        }

        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    private byte[] convertPkcs1ToPkcs8(byte[] pkcs1) throws IOException {
        byte[] version = derInteger(BigInteger.ZERO);
        byte[] algorithm = derSequence(
                derObjectIdentifier(new int[]{1, 2, 840, 113549, 1, 1, 1}),
                derNull()
        );
        byte[] privateKey = derOctetString(pkcs1);
        return derSequence(version, algorithm, privateKey);
    }

    private byte[] derSequence(byte[]... values) throws IOException {
        return der((byte) 0x30, concat(values));
    }

    private byte[] derInteger(BigInteger value) throws IOException {
        return der((byte) 0x02, value.toByteArray());
    }

    private byte[] derNull() throws IOException {
        return der((byte) 0x05, new byte[0]);
    }

    private byte[] derOctetString(byte[] value) throws IOException {
        return der((byte) 0x04, value);
    }

    private byte[] derObjectIdentifier(int[] oid) throws IOException {
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(oid[0] * 40 + oid[1]);
        for (int i = 2; i < oid.length; i++) {
            writeBase128(body, oid[i]);
        }
        return der((byte) 0x06, body.toByteArray());
    }

    private void writeBase128(ByteArrayOutputStream out, int value) {
        int length = 1;
        int tmp = value;
        while ((tmp >>= 7) > 0) {
            length++;
        }
        for (int i = length - 1; i >= 0; i--) {
            int b = (value >> (i * 7)) & 0x7f;
            out.write(i == 0 ? b : b | 0x80);
        }
    }

    private byte[] der(byte tag, byte[] value) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(tag);
        writeLength(out, value.length);
        out.write(value);
        return out.toByteArray();
    }

    private void writeLength(ByteArrayOutputStream out, int length) {
        if (length < 128) {
            out.write(length);
            return;
        }
        int bytes = 0;
        int tmp = length;
        while (tmp > 0) {
            bytes++;
            tmp >>= 8;
        }
        out.write(0x80 | bytes);
        for (int i = bytes - 1; i >= 0; i--) {
            out.write((length >> (i * 8)) & 0xff);
        }
    }

    private byte[] concat(byte[]... values) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] value : values) {
            out.write(value);
        }
        return out.toByteArray();
    }
}
