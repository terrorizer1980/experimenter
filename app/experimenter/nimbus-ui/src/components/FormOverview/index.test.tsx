/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DOCUMENTATION_LINKS_TOOLTIP } from ".";
import { FIELD_MESSAGES } from "../../lib/constants";
import { mockExperiment } from "../../lib/mocks";
import { NimbusDocumentationLinkTitle } from "../../types/globalTypes";
import { Subject } from "./mocks";

describe("FormOverview", () => {
  it("renders without any props", async () => {
    render(<Subject />);
    await screen.findByRole("form");
  });

  it("displays an alert for overall submit error", async () => {
    const submitErrors = {
      "*": ["Big bad happened"],
    };
    render(<Subject {...{ submitErrors }} />);
    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent(submitErrors["*"][0]);
  });

  it("displays feedback for per-field error", async () => {
    const submitErrors = {
      name: ["That name is terrible, man"],
    };
    render(<Subject {...{ submitErrors }} />);
    const feedback = await screen.findByRole("alert");
    expect(feedback).toHaveClass("invalid-feedback");
    expect(feedback).toHaveTextContent(submitErrors["name"][0]);
    expect(feedback).toHaveAttribute("data-for", "name");
  });

  describe("new experiment", () => {
    it("validates fields before allowing submit", async () => {
      const expected = {
        name: "Foo bar baz",
        hypothesis: "Some thing",
        application: "DESKTOP",
      };

      const onSubmit = jest.fn();
      render(<Subject {...{ onSubmit }} />);
      await screen.findByRole("form");

      const saveButton = screen.getByRole("button", { name: "Next" });
      await fillOutNewForm(expected);
      userEvent.click(saveButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        expect(onSubmit.mock.calls[0][0]).toEqual(expected);
      });
    });

    it("calls onCancel when cancel clicked", async () => {
      const onCancel = jest.fn();
      render(<Subject {...{ onCancel }} />);
      await screen.findByRole("form");

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      userEvent.click(cancelButton);
      await waitFor(() => expect(onCancel).toHaveBeenCalled());
    });

    it("disables create button when loading", async () => {
      const onSubmit = jest.fn();
      render(<Subject {...{ onSubmit, isLoading: true }} />);
      const form = await screen.findByRole("form");

      // Fill out valid form to ensure only
      // isLoading prevents submission
      await fillOutNewForm({
        name: "Foo bar baz",
        hypothesis: "Some thing",
        application: "DESKTOP",
      });

      const saveButton = screen.getByRole("button", { name: "Submitting" });
      expect(saveButton).toBeDisabled();

      userEvent.click(saveButton);
      fireEvent.submit(form);

      await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    });
  });

  describe("existing experiment", () => {
    it("validates fields and can save data", async () => {
      const experiment = mockExperiment();
      const onSubmit = jest.fn();
      const expected = {
        name: experiment.name,
        hypothesis: experiment.hypothesis,
        publicDescription: experiment.publicDescription,
        riskMitigationLink: experiment.riskMitigationLink,
        documentationLinks: experiment.documentationLinks,
      };

      render(<Subject {...{ onSubmit, experiment }} />);
      await screen.findByRole("form");
      await checkExistingForm(expected);

      const saveButton = screen.getByRole("button", { name: "Save" });
      const nextButton = screen.getByRole("button", {
        name: "Save and Continue",
      });
      const nameField = screen.getByLabelText("Public name");

      // Update the name in the form and expected data
      expected.name = "Let's Get Sentimental";
      userEvent.type(nameField, expected.name);

      userEvent.click(saveButton);
      userEvent.click(nextButton);

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
      expect(onSubmit.mock.calls).toEqual([
        // Save button just saves
        [expected, false],
        // Next button advances to next page
        [expected, true],
      ]);
    });

    it("requires a URL for the risk mitigation link", async () => {
      render(<Subject experiment={mockExperiment()} />);
      const linkField = await screen.findByLabelText(
        "Risk Mitigation Checklist Link",
      );

      userEvent.type(linkField, "whatchu-talkin-bout-willis");
      fireEvent.blur(linkField);

      await screen.findByText(FIELD_MESSAGES.URL, {
        selector: ".invalid-feedback",
      });

      userEvent.type(linkField, "https://www.com");
      fireEvent.blur(linkField);

      await waitFor(() =>
        expect(
          screen.queryByText(FIELD_MESSAGES.URL, {
            selector: ".invalid-feedback",
          }),
        ).not.toBeInTheDocument(),
      );
    });

    it("warns if description missing while prepping for review", async () => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?show-errors",
        },
      });

      const isMissingField = jest.fn(() => true);
      render(<Subject {...{ isMissingField, experiment: mockExperiment() }} />);

      await waitFor(() => expect(isMissingField).toHaveBeenCalled());
      await screen.findByTestId("missing-description");
    });

    it("disables save buttons when loading", async () => {
      const onSubmit = jest.fn();
      render(
        <Subject
          {...{ onSubmit, experiment: mockExperiment(), isLoading: true }}
        />,
      );
      await screen.findByRole("form");

      expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Save and Continue" }),
      ).toBeDisabled();
    });
  });

  describe("documentation links", () => {
    it("renders initial sets", async () => {
      const experiment = mockExperiment({
        documentationLinks: [
          {
            title: NimbusDocumentationLinkTitle.DESIGN_DOC,
            link: "https://mozilla.com",
          },
          {
            title: NimbusDocumentationLinkTitle.DS_JIRA,
            link: "https://mozilla.com",
          },
        ],
      });

      render(<Subject {...{ experiment }} />);

      const tooltip = await screen.findByTestId("tooltip-documentation-links");
      expect(tooltip).toHaveAttribute("data-tip", DOCUMENTATION_LINKS_TOOLTIP);

      const linkEls = await screen.findAllByTestId("DocumentationLink");
      expect(linkEls).toHaveLength(experiment.documentationLinks!.length);

      linkEls.forEach((linkEl, index) => {
        const selected = within(linkEl).getByRole("option", {
          selected: true,
        }) as HTMLSelectElement;
        expect(selected.value).toEqual(
          experiment.documentationLinks![index].title,
        );
      });
    });

    it("correctly updates and deletes sets", async () => {
      const onSubmit = jest.fn();
      const experiment = mockExperiment({
        documentationLinks: [
          {
            title: NimbusDocumentationLinkTitle.DS_JIRA,
            link: "https://bingo.bongo",
          },
        ],
      });

      render(<Subject {...{ experiment, onSubmit }} />);
      await screen.findByRole("form");
      const saveButton = screen.getByRole("button", { name: "Save" });
      const addButton = screen.getByRole("button", { name: "+ Add Link" });

      // Assert that the initial documentation link sets are rendered
      let sets = screen.getAllByTestId("DocumentationLink");
      experiment.documentationLinks!.forEach((value, index) => {
        assertDocumentationLinkFields(sets, value, index);
      });

      // The first remove button should not be present
      expect(
        getDocumentationLinkFields(sets, 0).removeButton,
      ).not.toBeInTheDocument();

      // Update the values of the first set
      experiment.documentationLinks![0] = {
        title: NimbusDocumentationLinkTitle.ENG_TICKET,
        link: "https://",
      };
      fillDocumentationLinkFields(experiment.documentationLinks![0], 0);

      // Whoops! Invalid URL.
      const feedback = await screen.findByRole("alert");
      expect(feedback).toHaveClass("invalid-feedback");
      expect(feedback).toHaveTextContent(FIELD_MESSAGES.URL);

      // Fix the invalid URL
      experiment.documentationLinks![0].link = "https://ooga.booga";
      fillDocumentationLinkFields(experiment.documentationLinks![0], 0);
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );

      // Add a new set and populate it
      fireEvent.click(addButton);
      experiment.documentationLinks!.push({
        title: NimbusDocumentationLinkTitle.DESIGN_DOC,
        link: "https://boingo.oingo",
      });
      fillDocumentationLinkFields(experiment.documentationLinks![1], 1);
      sets = screen.getAllByTestId("DocumentationLink");
      await waitFor(() =>
        assertDocumentationLinkFields(
          sets,
          experiment.documentationLinks![1],
          1,
        ),
      );

      // Add a new set and PARTIALLY populate it
      // This set should be filtered out and therefore will
      // not be added to expected output
      userEvent.click(addButton);
      const setData = {
        title: NimbusDocumentationLinkTitle.DESIGN_DOC,
        link: "",
      };
      fillDocumentationLinkFields(setData, 2);
      sets = screen.getAllByTestId("DocumentationLink");
      await waitFor(() => assertDocumentationLinkFields(sets, setData, 2));

      // Add a new set, and populate it with the data from the second field
      userEvent.click(addButton);
      fillDocumentationLinkFields(experiment.documentationLinks![1], 3);
      sets = screen.getAllByTestId("DocumentationLink");
      await waitFor(() =>
        assertDocumentationLinkFields(
          sets,
          experiment.documentationLinks![1],
          3,
        ),
      );

      // Now delete the second set
      userEvent.click(getDocumentationLinkFields(sets, 1).removeButton);
      await waitFor(() =>
        expect(screen.queryAllByTestId("DocumentationLink").length).toEqual(
          // Add one because this array doesn't include the field that will be filtered out
          experiment.documentationLinks!.length + 1,
        ),
      );

      userEvent.click(saveButton);
      await waitFor(() =>
        expect(onSubmit.mock.calls[0][0].documentationLinks).toEqual(
          experiment.documentationLinks!.map(({ title, link }) => ({
            title,
            link,
          })),
        ),
      );
    });

    it("displays feedback for per-field error", async () => {
      const experiment = mockExperiment();
      const submitErrors = {
        documentation_links: [
          {
            title: ["When the Curious Girl Realizes She Is Under Glass"],
            link: ["Bowl of oranges"],
          },
        ],
      };
      render(<Subject {...{ experiment, submitErrors }} />);
      const feedbacks = await screen.findAllByRole("alert");
      expect(feedbacks[0]).toHaveTextContent(
        submitErrors["documentation_links"][0].title[0],
      );
      expect(feedbacks[1]).toHaveTextContent(
        submitErrors["documentation_links"][0].link[0],
      );
    });
  });
});

const fillOutNewForm = async (expected: Record<string, string>) => {
  for (const [labelText, fieldValue] of [
    ["Public name", expected.name],
    ["Hypothesis", expected.hypothesis],
    ["Application", expected.application],
  ]) {
    const fieldName = screen.getByLabelText(labelText);

    userEvent.click(fieldName);
    fireEvent.blur(fieldName);

    if (labelText !== "Hypothesis") {
      await screen.findByLabelText(labelText, {
        selector: ".is-invalid:not(.is-valid)",
      });
    }

    userEvent.type(fieldName, fieldValue);
    fireEvent.blur(fieldName);

    await screen.findByLabelText(labelText, {
      selector: ".is-valid:not(.is-invalid)",
    });
  }
};

const checkExistingForm = async (expected: Record<string, any>) => {
  for (const [labelText, fieldValue] of [
    ["Public name", expected.name],
    ["Hypothesis", expected.hypothesis],
    ["Public description", expected.publicDescription],
    ["Risk Mitigation Checklist Link", expected.riskMitigationLink],
    ["documentationLinks", expected.documentationLinks],
  ]) {
    if (labelText === "documentationLinks") {
      const sets = screen.getAllByTestId("DocumentationLink");
      fieldValue.forEach(
        (value: { title: string; link: string }, index: number) => {
          assertDocumentationLinkFields(sets, value, index);
        },
      );
    } else {
      const fieldName = screen.getByLabelText(labelText) as HTMLInputElement;
      expect(fieldName.value).toEqual(fieldValue);
    }
  }
};

const getDocumentationLinkFields = (sets: HTMLElement[], index: number) => {
  const set = within(sets[index]);
  const titleField = set.getByRole("combobox") as HTMLSelectElement;
  const linkField = set.getByRole("textbox") as HTMLInputElement;
  const removeButton = set.queryByRole("button") as HTMLButtonElement;
  return { titleField, linkField, removeButton };
};

const assertDocumentationLinkFields = (
  sets: HTMLElement[],
  value: { title: string; link: string },
  index: number,
) => {
  const { titleField, linkField } = getDocumentationLinkFields(sets, index);
  expect(titleField.value).toEqual(value.title);
  expect(linkField.value).toEqual(value.link);
};

const fillDocumentationLinkFields = (
  value: { title: NimbusDocumentationLinkTitle; link: string },
  index: number,
) => {
  const sets = screen.getAllByTestId("DocumentationLink");
  const { titleField, linkField } = getDocumentationLinkFields(sets, index);
  userEvent.type(titleField, value.title);
  userEvent.type(linkField, value.link);
  fireEvent.blur(linkField);
};
