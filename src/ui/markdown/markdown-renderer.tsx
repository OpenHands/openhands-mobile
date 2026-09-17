import React from "react";
import {
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Lexer, type Token, type Tokens } from "marked";
import { colors } from "../../theme";
import { MarkdownInline } from "./inline";
import { md } from "./styles";
import { MarkdownTable } from "./table";

const MARKED_OPTIONS = { gfm: true, breaks: true } as const;

function lexBlocks(source: string): Token[] {
  return new Lexer(MARKED_OPTIONS).lex(source);
}

function lexInline(source: string): Token[] {
  return new Lexer(MARKED_OPTIONS).inlineTokens(source);
}

const ALERTS = {
  note: { label: "Note", color: colors.alertNote, bg: "rgba(96,165,250,0.10)" },
  tip: { label: "Tip", color: colors.alertTip, bg: "rgba(52,211,153,0.10)" },
  important: {
    label: "Important",
    color: colors.alertImportant,
    bg: "rgba(192,132,252,0.10)",
  },
  warning: {
    label: "Warning",
    color: colors.alertWarning,
    bg: "rgba(250,204,21,0.10)",
  },
  caution: {
    label: "Caution",
    color: colors.alertCaution,
    bg: "rgba(251,113,133,0.10)",
  },
} as const;

type AlertKind = keyof typeof ALERTS;

function tokensOf(token: Token): Token[] {
  return "tokens" in token && Array.isArray(token.tokens) ? token.tokens : [];
}

function detectAlert(token: Tokens.Blockquote): AlertKind | null {
  const first = token.tokens[0];
  if (!first || first.type !== "paragraph") return null;
  const text = first.raw?.trim() ?? "";
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
  return match ? (match[1].toLowerCase() as AlertKind) : null;
}

function stripAlertMarker(tokens: Token[]): Token[] {
  if (tokens[0]?.type !== "paragraph") return tokens;
  const paragraph = tokens[0] as Tokens.Paragraph;
  const nextRaw = paragraph.raw.replace(
    /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
    "",
  );
  const nextTokens = lexInline(nextRaw);
  return [{ ...paragraph, raw: nextRaw, text: nextRaw, tokens: nextTokens }, ...tokens.slice(1)];
}

function MarkdownBlocks({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        <MarkdownBlock key={`${token.type}-${index}`} token={token} />
      ))}
    </>
  );
}

function Paragraph({ token }: { token: Tokens.Paragraph | Tokens.Text }) {
  const inline = tokensOf(token);
  const chunks: React.ReactNode[] = [];
  let buffer: Token[] = [];
  const flush = (key: string) => {
    if (!buffer.length) return;
    chunks.push(
      <Text key={key} style={md.p}>
        <MarkdownInline tokens={buffer} />
      </Text>,
    );
    buffer = [];
  };

  inline.forEach((child, index) => {
    if (child.type === "image") {
      flush(`p-${index}`);
      const image = child as Tokens.Image;
      if (/^https?:/i.test(image.href)) {
        chunks.push(
          <Image
            key={`img-${index}`}
            source={{ uri: image.href }}
            style={md.image}
            accessibilityLabel={image.text || "Image"}
          />,
        );
      }
      return;
    }
    buffer.push(child);
  });
  flush("p-end");
  return <View>{chunks}</View>;
}

function ListBlock({ token }: { token: Tokens.List }) {
  return (
    <View style={md.list}>
      {token.items.map((item, index) => (
        <View key={item.raw + String(index)} style={md.li}>
          <Text style={md.liMark}>
            {token.ordered ? `${(token.start || 1) + index}.` : "•"}
          </Text>
          <View style={md.liBody}>
            <MarkdownBlocks tokens={item.tokens} />
          </View>
        </View>
      ))}
    </View>
  );
}

function QuoteBlock({ token }: { token: Tokens.Blockquote }) {
  const alert = detectAlert(token);
  if (alert) {
    const config = ALERTS[alert];
    return (
      <View
        style={[md.alert, { borderLeftColor: config.color, backgroundColor: config.bg }]}
      >
        <Text style={[md.alertTitle, { color: config.color }]}>{config.label}</Text>
        <MarkdownBlocks tokens={stripAlertMarker(token.tokens)} />
      </View>
    );
  }
  return (
    <View style={md.quote}>
      <Text style={md.quoteText}>
        <MarkdownInline
          tokens={token.tokens.flatMap((child) => tokensOf(child))}
        />
      </Text>
    </View>
  );
}

function CodeBlock({ token }: { token: Tokens.Code }) {
  return (
    <ScrollView horizontal style={md.codeBlock} showsHorizontalScrollIndicator>
      <Text style={md.codeText}>{token.text.replace(/\n$/, "")}</Text>
    </ScrollView>
  );
}

function MarkdownBlock({ token }: { token: Token }) {
  switch (token.type) {
    case "heading": {
      const heading = token as Tokens.Heading;
      const style =
        heading.depth === 1
          ? md.h1
          : heading.depth === 2
            ? md.h2
            : heading.depth === 3
              ? md.h3
              : heading.depth === 4
                ? md.h4
                : heading.depth === 5
                  ? md.h5
                  : md.h6;
      return (
        <Text style={style}>
          <MarkdownInline tokens={heading.tokens} />
        </Text>
      );
    }
    case "paragraph":
      return <Paragraph token={token as Tokens.Paragraph} />;
    case "text":
      return <Paragraph token={token as Tokens.Text} />;
    case "list":
      return <ListBlock token={token as Tokens.List} />;
    case "table":
      return <MarkdownTable token={token as Tokens.Table} />;
    case "blockquote":
      return <QuoteBlock token={token as Tokens.Blockquote} />;
    case "code":
      return <CodeBlock token={token as Tokens.Code} />;
    case "hr":
      return <View style={md.hr} />;
    case "space":
      return <View style={{ height: 8 }} />;
    case "html":
      return null;
    default:
      return "text" in token && token.text ? (
        <Text style={md.p}>{String(token.text)}</Text>
      ) : null;
  }
}

export function MarkdownRenderer({
  children,
  content,
}: {
  children?: string;
  content?: string;
}) {
  const source = content ?? children ?? "";
  if (!source.trim()) return null;
  const tokens = lexBlocks(source);
  return <View style={md.blockRoot}>{<MarkdownBlocks tokens={tokens} />}</View>;
}
