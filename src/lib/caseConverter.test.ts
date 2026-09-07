import { describe, expect, it } from "vitest";
import { convertCase, tokenize } from "./caseConverter";

describe("case converter", () => {
  it("tokenizes mixed separators and camel case", () => {
    expect(tokenize("helloWorld_test-value")).toEqual(["hello", "World", "test", "value"]);
  });
  it("supports programming and prose cases", () => {
    expect({
      upper: convertCase("hello world", "upper"), lower: convertCase("Hello World", "lower"),
      title: convertCase("hello world", "title"), sentence: convertCase("HELLO_WORLD", "sentence"),
      camel: convertCase("hello world", "camel"), pascal: convertCase("hello world", "pascal"),
      snake: convertCase("hello world", "snake"), kebab: convertCase("hello world", "kebab"),
      constant: convertCase("hello world", "constant"), dot: convertCase("hello world", "dot"),
    }).toEqual({ upper: "HELLO WORLD", lower: "hello world", title: "Hello World", sentence: "Hello world", camel: "helloWorld", pascal: "HelloWorld", snake: "hello_world", kebab: "hello-world", constant: "HELLO_WORLD", dot: "hello.world" });
  });
});
