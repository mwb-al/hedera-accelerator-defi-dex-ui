import { Flex } from "@chakra-ui/react";
import { FormInput, FormTextArea } from "@shared/ui-kit";
import { useFormContext } from "react-hook-form";
import { CreateDAODexSettingsForm } from "../types";
import { isValidUrl } from "@dex/utils";

export function DAODexDetailsForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateDAODexSettingsForm>();

  return (
    <Flex direction="column" gap="1.3rem">
      <FormInput<"title">
        inputProps={{
          id: "title",
          label: "Title",
          type: "text",
          placeholder: "Enter title",
          register: {
            ...register("title", {
              required: { value: true, message: "A title is required." },
            }),
          },
        }}
        isInvalid={Boolean(errors?.title)}
        errorMessage={errors?.title && errors?.title?.message}
      />
      <FormTextArea<"description">
        textAreaProps={{
          id: "description",
          label: "Description",
          placeholder: "Add a description",
          register: {
            ...register("description", {
              required: { value: true, message: "A description is required." },
              validate: (value) => value.length <= 240 || "Maximum character count for the description is 240.",
            }),
          },
        }}
        isInvalid={Boolean(errors?.description)}
        errorMessage={errors?.description && errors?.description?.message}
      />
      <FormInput<"linkToDiscussion">
        inputProps={{
          id: "linkToDiscussion",
          label: "Link to discussion",
          type: "text",
          placeholder: "Enter URL",
          register: {
            ...register("linkToDiscussion", {
              validate: (value) => isValidUrl(value) || "Invalid URL, Please try again.",
            }),
          },
        }}
        isInvalid={Boolean(errors?.linkToDiscussion)}
        errorMessage={errors?.linkToDiscussion && errors?.linkToDiscussion?.message}
      />
    </Flex>
  );
}
