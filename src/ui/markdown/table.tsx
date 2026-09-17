import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import type { Tokens } from "marked";
import { MarkdownInline, MarkdownInlineHtml } from "./inline";
import { md } from "./styles";

function cellText(cell: Tokens.TableCell): string {
  return cell.text || "";
}

function columnWidths(token: Tokens.Table): number[] {
  const widths = token.header.map((cell) =>
    Math.max(96, Math.min(280, cellText(cell).length * 8 + 24)),
  );
  for (const row of token.rows) {
    row.forEach((cell, index) => {
      widths[index] = Math.max(
        widths[index] ?? 96,
        Math.min(280, cellText(cell).length * 8 + 24),
      );
    });
  }
  return widths;
}

function alignOf(
  token: Tokens.Table,
  index: number,
): "left" | "center" | "right" {
  const align = token.align[index];
  return align === "center" || align === "right" ? align : "left";
}

function WebTable({ token }: { token: Tokens.Table }) {
  return React.createElement(
    "div",
    { "data-oh-md-table": "1" },
    React.createElement(
      "table",
      null,
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          token.header.map((cell, index) =>
            React.createElement(
              "th",
              { key: `th-${index}`, style: { textAlign: alignOf(token, index) } },
              React.createElement(MarkdownInlineHtml, { tokens: cell.tokens }),
            ),
          ),
        ),
      ),
      React.createElement(
        "tbody",
        null,
        token.rows.map((row, rowIndex) =>
          React.createElement(
            "tr",
            { key: `tr-${rowIndex}` },
            row.map((cell, cellIndex) =>
              React.createElement(
                "td",
                {
                  key: `td-${rowIndex}-${cellIndex}`,
                  style: { textAlign: alignOf(token, cellIndex) },
                },
                React.createElement(MarkdownInlineHtml, { tokens: cell.tokens }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function NativeTable({ token }: { token: Tokens.Table }) {
  const widths = columnWidths(token);
  const lastRow = token.rows.length - 1;
  const lastCol = token.header.length - 1;

  return (
    <ScrollView horizontal style={md.tableScroll} showsHorizontalScrollIndicator>
      <View style={md.table}>
        <View style={md.tr}>
          {token.header.map((cell, index) => (
            <View
              key={`th-${index}`}
              style={[
                md.th,
                { width: widths[index], minWidth: widths[index] },
                index === lastCol && { borderRightWidth: 0 },
              ]}
            >
              <Text style={[md.thText, { textAlign: alignOf(token, index) }]}>
                <MarkdownInline tokens={cell.tokens} />
              </Text>
            </View>
          ))}
        </View>
        {token.rows.map((row, rowIndex) => (
          <View key={`tr-${rowIndex}`} style={md.tr}>
            {row.map((cell, cellIndex) => (
              <View
                key={`td-${rowIndex}-${cellIndex}`}
                style={[
                  md.td,
                  { width: widths[cellIndex], minWidth: widths[cellIndex] },
                  cellIndex === lastCol && { borderRightWidth: 0 },
                  rowIndex === lastRow && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[md.tdText, { textAlign: alignOf(token, cellIndex) }]}>
                  <MarkdownInline tokens={cell.tokens} />
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function MarkdownTable({ token }: { token: Tokens.Table }) {
  return Platform.OS === "web" ? (
    <WebTable token={token} />
  ) : (
    <NativeTable token={token} />
  );
}
