import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { BookingQuestion } from "@/components/BookingQuestion";

it("gives multiple answers one named group and associates guidance and errors", () => {
  const html = renderToStaticMarkup(createElement(BookingQuestion, {
    question: { id: "q_sample", prompt: "Choose meals", description: "Choose all that apply", inputType: "MULTI_SELECT", required: true, options: [{ id: "o_one", label: "Vegetarian" }, { id: "o_two", label: "Vegan" }] },
    value: ["o_two"], invalid: true, onChange: () => undefined,
  }));
  expect(html).toContain('<fieldset id="question-q_sample"');
  expect(html).toMatch(/<legend[^>]*>Choose meals/);
  expect(html).toContain('aria-describedby="question-q_sample-description booking-problem"');
  expect(html).toContain('id="question-q_sample-description"');
  expect(html).toContain('checked=""');
  expect(html).not.toContain('for="question-q_sample"');
});
