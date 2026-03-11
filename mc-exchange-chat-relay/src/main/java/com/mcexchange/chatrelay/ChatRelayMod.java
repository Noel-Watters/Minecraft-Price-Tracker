package com.mcexchange.chatrelay;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.message.v1.ClientReceiveMessageEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.BlockPos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChatRelayMod implements ClientModInitializer {
  public static final String MOD_ID = "mcexchange-chat-relay";
  public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

  // State tracking for multi-line exchange messages
  private static boolean inExchangeMessage = false;
  private static StringBuilder exchangeBuilder = new StringBuilder();
  private static long lastMessageTime = 0;

  @Override
  public void onInitializeClient() {
    LOGGER.info("MC Exchange Chat Relay starting up!");

    // Register client message listener to capture all received messages
    ClientReceiveMessageEvents.GAME.register(
        (text, overlay) -> {
          onServerMessage(text);
        });
  }

  private BlockPos getTargetedBlock() {
    double maxDistance = 20.0;

    // The raycast method for an entity
    HitResult hitResult = MinecraftClient.getInstance().player.raycast(maxDistance, 0.0F, false);

    // Check if the result hit a block
    if (hitResult.getType() == HitResult.Type.BLOCK) {
      BlockHitResult blockHit = (BlockHitResult) hitResult;
      return blockHit.getBlockPos();
    }
    return null;
  }

  private void onServerMessage(Text message) {
    String messageText = message.getString();
    long currentTime = System.currentTimeMillis();

    // Debug: Log all messages to see what we're receiving
    LOGGER.info("Received message: {}", messageText);

    // Reset if too much time has passed (1 second timeout)
    if (currentTime - lastMessageTime > 1000) {
      inExchangeMessage = false;
      exchangeBuilder.setLength(0);
    }
    lastMessageTime = currentTime;

    // Check if this starts an exchange message sequence
    if (messageText.contains("exchanges present")) {
      inExchangeMessage = true;
      exchangeBuilder.setLength(0);
      exchangeBuilder.append(messageText).append("\n");
      LOGGER.info("🔍 Started collecting exchange message");
      return;
    }

    // If we're collecting an exchange message, continue collecting
    if (inExchangeMessage) {
      LOGGER.info("shits not showing LOL!\n{}", messageText);
      exchangeBuilder.append(messageText).append("\n");

      // Check if this message completes the exchange (ends with "exchanges available")
      if (messageText.contains("exchange available")
          || messageText.contains("exchanges available")) {
        String completeMessage = exchangeBuilder.toString().trim();
        LOGGER.info("📦 Complete exchange message collected:\n{}", completeMessage);

        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) {
          String playerName = client.player.getName().getString();

          BlockPos pos = getTargetedBlock();
          if (pos == null) return;
          String dimension =
              client.world != null
                  ? client.world.getRegistryKey().getValue().toString()
                  : "minecraft:overworld";

          // Parse and send to backend
          ExchangeParser.parseAndSend(playerName, completeMessage, dimension, pos);
        }

        // Reset for next exchange
        inExchangeMessage = false;
        exchangeBuilder.setLength(0);
      }
    }
  }
}
