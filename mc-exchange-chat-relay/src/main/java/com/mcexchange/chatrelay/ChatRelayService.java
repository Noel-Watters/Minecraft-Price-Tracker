package com.mcexchange.chatrelay;

import com.google.gson.Gson;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

public class ChatRelayService {
  private static final HttpClient client = HttpClient.newHttpClient();
  private static final String BACKEND_URL =
      System.getProperty("mcexchange.backend.url", "https://beacon-civmc.fly.dev");
  private static final Gson gson = new Gson();

  public static void sendExchangeData(ExchangeParser.ExchangeData exchange) {
    ChatRelayMod.LOGGER.info(
        "🚀 Attempting to send exchange data to backend: {} {} -> {} {}",
        exchange.input_qty,
        exchange.input_item_id,
        exchange.output_qty,
        exchange.output_item_id);

    CompletableFuture.runAsync(
        () -> {
          try {
            // Add timestamp
            ExchangePayload payload = new ExchangePayload();
            payload.ts = Instant.now().toString();
            payload.player = exchange.player;
            payload.dimension = exchange.dimension;
            payload.x = exchange.x;
            payload.y = exchange.y;
            payload.z = exchange.z;
            payload.loc_src = exchange.loc_src;
            payload.exchange_present = exchange.exchange_present;
            payload.input_item_id = exchange.input_item_id;
            payload.input_item_name = exchange.input_item_id;
            payload.input_qty = exchange.input_qty;
            payload.output_item_id = exchange.output_item_id;
            payload.output_item_name = exchange.input_item_id;
            payload.output_qty = exchange.output_qty;
            payload.exchange_possible = exchange.exchange_possible;
            payload.raw = exchange.raw;
            payload.hash_id = exchange.hash_id;
            payload.compacted_input = exchange.compacted_input;
            payload.compacted_output = exchange.compacted_output;
            payload.input_enchantments = exchange.input_enchantments;
            payload.output_enchantments = exchange.output_enchantments;

            String json = gson.toJson(payload);

            HttpRequest request =
                HttpRequest.newBuilder()
                    .uri(URI.create(BACKEND_URL + "/api/exchanges"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            ChatRelayMod.LOGGER.info(
                "📡 Sending HTTP request to: {}", BACKEND_URL + "/api/exchanges");
            ChatRelayMod.LOGGER.info("📋 JSON payload: {}", json);

            client
                .sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(
                    response -> {
                      if (response.statusCode() == 200 || response.statusCode() == 201) {
                        ChatRelayMod.LOGGER.info(
                            "Exchange data sent successfully! Status: {}, Response: {}",
                            response.statusCode(),
                            response.body());
                      } else {
                        ChatRelayMod.LOGGER.error(
                            "Failed to send exchange data: {} - {}",
                            response.statusCode(),
                            response.body());
                      }
                    })
                .exceptionally(
                    ex -> {
                      ChatRelayMod.LOGGER.error("HTTP request failed with exception", ex);
                      return null;
                    });
          } catch (Exception e) {
            ChatRelayMod.LOGGER.error("Error sending exchange data", e);
          }
        });
  }

  private static class ExchangePayload {
    public String ts;
    public String player;
    public String dimension;
    public int x, y, z;
    public String loc_src;
    public String input_item_id;
    public String input_item_name;
    public int input_qty;
    public int exchange_present;
    public String output_item_id;
    public String output_item_name;
    public int output_qty;
    public int exchange_possible;
    public String raw;
    public String hash_id;
    public boolean compacted_input;
    public boolean compacted_output;
    public String[] input_enchantments;
    public String[] output_enchantments;
  }
}
