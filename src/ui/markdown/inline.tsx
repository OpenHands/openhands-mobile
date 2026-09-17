import React from "react";
import { Linking, Text } from "react-native";
import type { Token, Tokens } from "marked";
import { md } from "./styles";

const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

function asTokens(value: Token[] | undefined): Token[] {
  return value ?? [];
}

export function MarkdownInline({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        <InlineToken key={`${token.type}-${index}`} token={token} />
      ))}
    </>
  );
}

/** HTML inline for web tables so cells inherit Canvas th/td colors. */
export function MarkdownInlineHtml({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        <HtmlInlineToken key={`${token.type}-${index}`} token={token} />
      ))}
    </>
  );
}

function InlineToken({ token }: { token: Token }) {
  switch (token.type) {
    case "strong":
      return (
        <Text style={md.strong}>
          <MarkdownInline tokens={asTokens((token as Tokens.Strong).tokens)} />
        </Text>
      );
    case "em":
      return (
        <Text style={md.em}>
          <MarkdownInline tokens={asTokens((token as Tokens.Em).tokens)} />
        </Text>
      );
    case "del":
      return (
        <Text style={md.del}>
          <MarkdownInline tokens={asTokens((token as Tokens.Del).tokens)} />
        </Text>
      );
    case "codespan":
      return <Text style={md.inlineCode}>{(token as Tokens.Codespan).text}</Text>;
    case "link": {
      const link = token as Tokens.Link;
      const href = link.href ?? "";
      return (
        <Text
          style={md.link}
          onPress={() => {
            if (SAFE_HREF.test(href)) void Linking.openURL(href);
          }}
        >
          {link.tokens ? (
            <MarkdownInline tokens={link.tokens} />
          ) : (
            link.text
          )}
        </Text>
      );
    }
    case "br":
      return <Text>{"\n"}</Text>;
    case "escape":
      return <Text>{(token as Tokens.Escape).text}</Text>;
    case "text": {
      const text = token as Tokens.Text;
      if (text.tokens?.length) {
        return <MarkdownInline tokens={text.tokens} />;
      }
      return <Text>{text.text}</Text>;
    }
    case "html":
      return null;
    default:
      return "raw" in token ? <Text>{String(token.raw)}</Text> : null;
  }
}

function HtmlInlineToken({ token }: { token: Token }) {
  switch (token.type) {
    case "strong":
      return React.createElement(
        "strong",
        null,
        React.createElement(MarkdownInlineHtml, {
          tokens: asTokens((token as Tokens.Strong).tokens),
        }),
      );
    case "em":
      return React.createElement(
        "em",
        null,
        React.createElement(MarkdownInlineHtml, {
          tokens: asTokens((token as Tokens.Em).tokens),
        }),
      );
    case "del":
      return React.createElement(
        "del",
        null,
        React.createElement(MarkdownInlineHtml, {
          tokens: asTokens((token as Tokens.Del).tokens),
        }),
      );
    case "codespan":
      return React.createElement("code", null, (token as Tokens.Codespan).text);
    case "link": {
      const link = token as Tokens.Link;
      const href = link.href ?? "";
      const safe = SAFE_HREF.test(href);
      return React.createElement(
        "a",
        safe
          ? { href, target: "_blank", rel: "noreferrer noopener" }
          : { href: undefined },
        link.tokens
          ? React.createElement(MarkdownInlineHtml, { tokens: link.tokens })
          : link.text,
      );
    }
    case "br":
      return React.createElement("br");
    case "escape":
      return (token as Tokens.Escape).text;
    case "text": {
      const text = token as Tokens.Text;
      if (text.tokens?.length) {
        return React.createElement(MarkdownInlineHtml, { tokens: text.tokens });
      }
      return text.text;
    }
    case "html":
      return null;
    default:
      return "raw" in token ? String(token.raw) : null;
  }
}
