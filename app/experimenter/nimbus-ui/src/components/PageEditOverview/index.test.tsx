/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MockedResponse } from "@apollo/client/testing";
import { navigate } from "@reach/router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import React from "react";
import { UPDATE_EXPERIMENT_MUTATION } from "../../gql/experiments";
import { SUBMIT_ERROR } from "../../lib/constants";
import { mockExperimentMutation, mockExperimentQuery } from "../../lib/mocks";
import FormOverview from "../FormOverview";
import { Subject } from "./mocks";

describe("PageEditOverview", () => {
  beforeAll(() => fetchMock.enableMocks());
  afterAll(() => fetchMock.disableMocks());

  beforeEach(() => {
    mockSubmitData = {
      name: experiment.name,
      hypothesis: experiment.hypothesis!,
      publicDescription: experiment.publicDescription!,
      riskMitigationLink: experiment.riskMitigationLink!,
    };
    mutationMock = mockExperimentMutation(
      UPDATE_EXPERIMENT_MUTATION,
      { ...mockSubmitData, id: experiment.id },
      "updateExperiment",
      {
        experiment: mockSubmitData,
      },
    );
  });

  it("renders as expected", async () => {
    render(<Subject mocks={[mock]} />);
    await screen.findByTestId("PageEditOverview");
  });

  it("handles form submission", async () => {
    render(<Subject mocks={[mock, mutationMock]} />);
    await screen.findByTestId("PageEditOverview");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
  });

  it("handles form next button", async () => {
    render(<Subject mocks={[mock, mutationMock]} />);
    await screen.findByTestId("PageEditOverview");

    fireEvent.click(screen.getByRole("button", { name: "Save and Continue" }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith("branches");
    });
  });

  it("handles form submission with server-side validation errors", async () => {
    const expectedErrors = {
      name: { message: "already exists" },
    };
    // @ts-ignore - data is not typed on result
    mutationMock.result.data.updateExperiment.message = expectedErrors;
    render(<Subject mocks={[mock, mutationMock]} />);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    const feedback = await screen.findByRole("alert");
    expect(feedback).toHaveTextContent(JSON.stringify(expectedErrors));
  });

  it("handles form submission with bad server data", async () => {
    // @ts-ignore - intentionally breaking this type for error handling
    delete mutationMock.result.data.updateExperiment;
    render(<Subject mocks={[mock, mutationMock]} />);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    const feedback = await screen.findByRole("alert");
    expect(feedback).toHaveTextContent(JSON.stringify({ "*": SUBMIT_ERROR }));
  });

  it("handles experiment form submission with server API error", async () => {
    // @ts-ignore - errors is not typed on result
    mutationMock.result.errors = [new Error("an error")];
    render(<Subject mocks={[mock, mutationMock]} />);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    const feedback = await screen.findByRole("alert");
    expect(feedback).toHaveTextContent(JSON.stringify({ "*": SUBMIT_ERROR }));
  });
});

const { mock, experiment } = mockExperimentQuery("demo-slug");

let mutationMock: MockedResponse;
let mockSubmitData: Record<string, string> = {};
const mockSubmit = jest.fn();

jest.mock("@reach/router", () => ({
  ...jest.requireActual("@reach/router"),
  navigate: jest.fn(),
}));

jest.mock("../FormOverview", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<typeof FormOverview>) => {
    const handleSubmit = () => {
      mockSubmit();
      props.onSubmit(mockSubmitData, false);
    };
    const handleNext = () => {
      mockSubmit();
      props.onSubmit(mockSubmitData, true);
    };
    return (
      <div data-testid="FormOverview">
        <div role="alert">{JSON.stringify(props.submitErrors)}</div>
        <button onClick={handleSubmit}>Save</button>
        <button onClick={handleNext}>Save and Continue</button>
      </div>
    );
  },
}));
