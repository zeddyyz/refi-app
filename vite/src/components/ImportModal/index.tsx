import {
  actionAddPathExpander,
  actionImportDocs,
} from "@/atoms/firestore.action";
import { globalHotKeys } from "@/atoms/hotkeys";
import { actionSubmitQuery } from "@/atoms/navigator.action";
import {
  importCollectionPathAtom,
  importFileAtom,
  isImportModalAtom,
} from "@/atoms/ui";
import { notifyErrorPromise } from "@/atoms/ui.action";
import {
  ignoreBackdropEvent,
  isCollection,
  readerFilePromise,
} from "@/utils/common";
import {
  Checkbox,
  Field,
  FileUpload,
  Input,
  Label,
  Message,
} from "@zendeskgarden/react-forms";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input as ShadcnInput } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import csvtojson from "csvtojson";
import React, { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Controller, useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import SelectComboBox from "../SelectComboBox";

const ImportModal = () => {
  const collectionPath = useRecoilValue(importCollectionPathAtom);
  const [file, setFile] = useRecoilState(importFileAtom);
  const [docs, setDocs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useRecoilState(isImportModalAtom);
  const { register, handleSubmit, formState, watch, errors, control } = useForm(
    {
      mode: "onChange",
      defaultValues: {
        path: collectionPath,
        idField: "__id__",
      },
    }
  );

  useEffect(() => {
    register("autoId" as any, {});
    register("idField" as any, {});
  }, []);

  const isAutoId = watch("autoId");

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ["application/json", "text/comma-separated-values", "text/csv"],
    onDrop,
    multiple: false,
  });


  const onSubmit = (value: any) => {
    // TODO: If there is really large list, we should show loading somewhere
    actionImportDocs(value.path, docs, {
      idField: value.isAutoId ? null : value.idField,
      autoParseJSON: value.autoParseJSON,
    })
      .then(() => {
        setFile(undefined);
        setIsOpen(false);
        actionAddPathExpander([value.path]); // Assume that imported success we will also have new path
        if (value.path === collectionPath) {
          // Auto query again if current view same as imported path
          actionSubmitQuery();
          globalHotKeys.RESET_PROPERTY.handler(null);
        }
      })
      .catch(notifyErrorPromise);
  };

  const parseJSONDocFile = (data: string): any[] => {
    const fileData = JSON.parse(data);
    return Array.isArray(fileData) ? fileData : [fileData];
  };

  const parseCSVDocFile = (data: string): Promise<any[]> => {
    return new Promise((resolve) => {
      csvtojson().fromString(data).then(resolve);
    });
  };

  useEffect(() => {
    // TODO: Migrate me to worker to reduce the UI thread workload
    if (file) {
      readerFilePromise(file).then((fileData) => {
        if (file.type.indexOf("csv") >= 0) {
          parseCSVDocFile(fileData).then(setDocs);
        } else {
          setDocs(parseJSONDocFile(fileData));
        }
      });
    } else {
      setDocs([]);
    }
  }, [file]);

  const handleOnCancel = () => {
    setIsOpen(false);
    setFile(undefined);
  };

  const fileType = useMemo(() => {
    if (file) {
      if (file.type.indexOf("csv") >= 0) {
        return "csv";
      }
      return "json";
    }

    return "";
  }, [file]);

  const idField = useMemo(() => {
    if (fileType && !isAutoId && docs[0]) {
      if (fileType === "csv") {
        const sampleColumn = Object.keys(docs[0]);
        return (
          <Field>
            <Label>Id field</Label>
            <Controller
              control={control}
              name="idField"
              render={({ onChange, value, ref }) => (
                <SelectComboBox
                  className="mt-2"
                  items={sampleColumn}
                  selectedItem={value}
                  handleSelectedItemChange={onChange}
                />
              )}
            />
          </Field>
        );
      }
      return (
        <Field>
          <Label>Id field</Label>
          <Input
            isCompact
            name="idField"
            defaultValue="__id__"
            ref={register}
          />
        </Field>
      );
    }

    return null;
  }, [fileType, isAutoId, docs, control]);

  // TODO: Path picker, validate path
  // TODO: Add analysis like: Preview import file, how many docs will be imported, warning if it not match current collection schema

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[60%] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import data</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="space-y-4 h-96">
            <Field>
              <Label>Path</Label>
              <Controller
                control={control}
                name="path"
                defaultValue={collectionPath}
                rules={{
                  validate: (value) =>
                    isCollection(value) || "It must be collection path",
                  required: true,
                }}
                render={({ onChange, value, ref }, { invalid }) => (
                  <Input
                    isCompact
                    value={value}
                    validation={invalid ? "error" : "success"}
                    onChange={(e) => onChange(e.target.value)}
                    ref={ref}
                  />
                )}
              />
              {errors.path && (
                <Message validation="error">{errors.path.message}</Message>
              )}
            </Field>
            <Field>
              <FileUpload {...getRootProps()} isDragging={isDragActive}>
                {isDragActive ? (
                  <span>Drop JSON/CSV file here</span>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    {file ? (
                      file.name
                    ) : (
                      <span>Choose a JSON/CSV file to import</span>
                    )}
                  </div>
                )}
                <Input {...getInputProps()} />
              </FileUpload>
            </Field>
            <Field>
              <Controller
                control={control}
                name="autoId"
                defaultValue={true}
                render={({ onChange, value, ref }) => (
                  <Checkbox
                    ref={ref}
                    checked={value}
                    onChange={() => onChange(!value)}
                  >
                    <Label>Auto generate ID</Label>
                  </Checkbox>
                )}
              />
            </Field>
            {idField}
            {fileType === "csv" && (
              <Field>
                <Controller
                  control={control}
                  name="autoParseJSON"
                  defaultValue={true}
                  render={({ onChange, value, ref }) => (
                    <Checkbox
                      ref={ref}
                      checked={value}
                      onChange={() => onChange(!value)}
                    >
                      <Label>Auto parse JSON value</Label>
                    </Checkbox>
                  )}
                />
              </Field>
            )}
          </div>
        </form>
        <DialogFooter className="p-4">
          <ShadcnButton variant="outline" size="sm" onClick={() => handleOnCancel()}>
            Cancel
          </ShadcnButton>
          <ShadcnButton
            size="sm"
            disabled={!formState.isValid || docs.length <= 0}
            onClick={handleSubmit(onSubmit)}
            type="submit"
          >
            Import {docs.length > 0 && `${docs.length} doc(s)`}
          </ShadcnButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
