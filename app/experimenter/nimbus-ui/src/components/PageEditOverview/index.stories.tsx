/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { withLinks } from "@storybook/addon-links";
import { withQuery } from "@storybook/addon-queryparams";
import { storiesOf } from "@storybook/react";
import React from "react";
import { mockExperimentQuery } from "../../lib/mocks";
import { Subject } from "./mocks";

const { mock } = mockExperimentQuery("demo-slug");
const { mock: mockMissingFields } = mockExperimentQuery("demo-slug", {
  publicDescription: "",
  readyForReview: {
    ready: false,
    message: {
      public_description: ["This field may not be null."],
      risk_mitigation_link: ["This field may not be null."],
    },
  },
});

storiesOf("pages/EditOverview", module)
  .addDecorator(withLinks)
  .addDecorator(withQuery)
  .add("basic", () => <Subject mocks={[mock]} />)
  .add("missing fields", () => <Subject mocks={[mockMissingFields]} />, {
    query: {
      "show-errors": true,
    },
  });
