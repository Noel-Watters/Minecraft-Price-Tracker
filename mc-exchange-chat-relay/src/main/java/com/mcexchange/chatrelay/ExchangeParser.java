package com.mcexchange.chatrelay;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import net.minecraft.util.math.BlockPos;

public class ExchangeParser {
  private static final Pattern EXCHANGE_COUNT_PATTERN =
      Pattern.compile("\\((\\d+)/(\\d+)\\) exchanges present");
  private static final Pattern EXCHANGE_AVAILABLE_PATTERN =
      Pattern.compile("(\\d+) exchanges available");

  public static void parseAndSend(
      String player, String rawMessage, String dimension, BlockPos pos) {
    try {
      List<ExchangeData> exchanges = parseExchanges(player, rawMessage, dimension, pos);

      for (ExchangeData exchange : exchanges) {
        ChatRelayService.sendExchangeData(exchange);
      }
    } catch (Exception e) {
      ChatRelayMod.LOGGER.error("Error parsing exchange message: {}", rawMessage, e);
    }
  }

  private static final Set<String> ENCHANTMENT_LIST =
      new HashSet<>(
          Arrays.asList(
              "Mending",
              "Unbreaking",
              "Curse of Vanishing",
              "Aqua Affinity",
              "Blast Protection",
              "Curse of Binding",
              "Depth Strider",
              "Feather Falling",
              "Fire Protection",
              "Frost Walker",
              "Projectile Protection",
              "Protection",
              "Respiration",
              "Soul Speed",
              "Thorns",
              "Swift Sneak",
              "Bane of Arthropods",
              "Breach",
              "Density",
              "Efficiency",
              "Fire Aspect",
              "Looting",
              "Impaling",
              "Knockback",
              "Sharpness",
              "Smite",
              "Sweeping Edge",
              "Wind Burst",
              "Channeling",
              "Flame",
              "Infinity",
              "Loyalty",
              "Riptide",
              "Multishot",
              "Piercing",
              "Power",
              "Punch",
              "Quick Charge",
              "Fortune",
              "Luck of the Sea",
              "Lure",
              "Silk Touch"));

  private static void parseEnchantment(String line, Vector<String> enchantments) {
    String trimmedLine = line.trim();
    String[] parts = trimmedLine.split("\\s+"); // Split by one or more spaces

    if (parts.length < 1) {
      return;
    }

    // The last part of the line is potentially the enchantment level
    String potentialLevel = parts[parts.length - 1];

    String enchantmentName = new String();

    try {
      Integer.parseInt(potentialLevel);
      enchantmentName = String.join(" ", Arrays.copyOf(parts, parts.length - 1)).trim();
    } catch (NumberFormatException e) {
      enchantmentName = trimmedLine;
    }

    // The parts before the level form the enchantment name

    // Check if the extracted name is a valid enchantment
    if (ENCHANTMENT_LIST.contains(enchantmentName)) {
      enchantments.add(new String(line));
    }
  }

  private static List<ExchangeData> parseExchanges(
      String player, String rawMessage, String dimension, BlockPos pos) {
    List<ExchangeData> exchanges = new ArrayList<>();
    String[] lines = rawMessage.split("\n");

    int exchangesAvailable = 0;
    String currentInput = null;
    String currentInputCustom = null;
    int currentInputQty = 0;
    int currentOutputQty = 0;
    String currentOutput = null;
    String currentOutputCustom = null;
    Vector<String> input_enchantments = new Vector<>();
    Vector<String> output_enchantments = new Vector<>();
    boolean received_output = false;
    int exchange_present = 0;

    try {
      for (int i = 0; i < lines.length; i++) {
        String line = lines[i].trim();

        // Parse exchange availability count
        Matcher availableMatcher = EXCHANGE_AVAILABLE_PATTERN.matcher(line);
        if (availableMatcher.find()) {
          exchangesAvailable = Integer.parseInt(availableMatcher.group(1));
          continue;
        }

        Pattern presentPattern = Pattern.compile("\\((\\d+)/\\d+\\) exchanges present");
        Matcher presentMatcher = presentPattern.matcher(line);

        if (presentMatcher.find()) {
          exchange_present = Integer.parseInt(presentMatcher.group(1));
          continue;
        }

        // Parse input line: "Input: 1 Diamond"
        if (line.startsWith("Input:")) {
          Pattern inputPattern =
              Pattern.compile("Input: (\\d+)\\s+([a-zA-Z\\s]+?)\\s*(?:\"(.*?)\"|$)");
          Matcher inputMatcher = inputPattern.matcher(line);
          if (inputMatcher.find()) {
            currentInputQty = Integer.parseInt(inputMatcher.group(1));
            currentInput = inputMatcher.group(2).trim();
            String custom = inputMatcher.group(3);
            if (custom != null) currentInputCustom = custom.trim();
          }
          continue;
        }

        // Parse output line: "Output: 2 Sand"
        if (line.startsWith("Output:") && currentInput != null) {
          Pattern outputPattern =
              Pattern.compile("Output: (\\d+)\\s+([a-zA-Z\\s]+?)\\s*(?:\"(.*?)\"|$)");
          Matcher outputMatcher = outputPattern.matcher(line);
          if (outputMatcher.find()) {
            currentOutputQty = Integer.parseInt(outputMatcher.group(1));
            currentOutput = outputMatcher.group(2).trim();
            String custom = outputMatcher.group(3);
            if (custom != null) currentOutputCustom = custom.trim();
          }
          received_output = true;
          continue;
        }

        ChatRelayMod.LOGGER.info("PARSED LINE: {}", line);
        parseEnchantment(line, received_output ? output_enchantments : input_enchantments);
      }
    } catch (Exception e) {
      ChatRelayMod.LOGGER.info(String.format("{}", e));
    }

    ChatRelayMod.LOGGER.info(currentOutput);

    if (currentOutput != null) {
      // Create exchange data
      ExchangeData exchange = new ExchangeData();
      exchange.player = player;
      exchange.dimension = dimension;
      exchange.x = pos.getX();
      exchange.y = pos.getY();
      exchange.z = pos.getZ();
      exchange.exchange_present = exchange_present;
      exchange.loc_src = "chat_relay";
      exchange.input_item_id = currentInput;
      exchange.input_qty = currentInputQty;
      exchange.output_item_id = currentOutput;
      exchange.output_qty = currentOutputQty;
      exchange.exchange_possible = exchangesAvailable;
      exchange.raw = rawMessage;
      exchange.hash_id = generateHashId(exchange);
      exchange.compacted_input = isCompactedItem(currentInput);
      exchange.compacted_output = isCompactedItem(currentOutput);
      exchange.output_enchantments = output_enchantments.toArray(new String[0]);
      exchange.input_enchantments = input_enchantments.toArray(new String[0]);

      exchanges.add(exchange);
      ChatRelayMod.LOGGER.info(
          "Parsed exchange: {} {} -> {} {}",
          currentInputQty,
          currentInput,
          currentOutputQty,
          currentOutput);

      // Reset for next exchange
      currentInput = null;
      currentInputQty = 0;
    }
    return exchanges;
  }

  private static String generateHashId(ExchangeData exchange) {
    try {
      String data =
          String.format(
              "%s_%d_%d_%d_%s_%d_%s_%d",
              exchange.player,
              exchange.x,
              exchange.y,
              exchange.z,
              exchange.input_item_id,
              exchange.input_qty,
              exchange.output_item_id,
              exchange.output_qty);

      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));

      StringBuilder hexString = new StringBuilder();
      for (byte b : hash) {
        String hex = Integer.toHexString(0xff & b);
        if (hex.length() == 1) hexString.append('0');
        hexString.append(hex);
      }
      return hexString.toString().substring(0, 16); // First 16 chars
    } catch (Exception e) {
      String fallbackData =
          String.format(
              "%s_%d_%d_%d_%s_%d_%s_%d",
              exchange.player,
              exchange.x,
              exchange.y,
              exchange.z,
              exchange.input_item_id,
              exchange.input_qty,
              exchange.output_item_id,
              exchange.output_qty);
      return String.valueOf(fallbackData.hashCode());
    }
  }

  private static boolean isCompactedItem(String itemName) {
    return itemName.toLowerCase().contains("block")
        || itemName.toLowerCase().contains("compressed")
        || itemName.toLowerCase().contains("compact");
  }

  public static class ExchangeData {
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
