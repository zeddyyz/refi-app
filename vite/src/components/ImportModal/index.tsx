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
import { isCollection, readerFilePromise } from "@/utils/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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
          <div className="space-y-1.5">
            <Label htmlFor="import-id-field">Id field</Label>
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
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label htmlFor="import-id-field">Id field</Label>
          <Input
            id="import-id-field"
            name="idField"
            defaultValue="__id__"
            ref={register}
          />
        </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="import-path">Path</Label>
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
                    id="import-path"
                    value={value}
                    aria-invalid={invalid}
                    className={cn(invalid && "border-destructive")}
                    onChange={(e) => onChange(e.target.value)}
                    ref={ref}
                  />
                )}
              />
              {errors.path && (
                <p className="text-sm text-destructive mt-1">
                  {errors.path.message}
                </p>
              )}
            </div>
            <div
              {...getRootProps({
                className: cn(
                  "border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer transition-colors hover:bg-accent",
                  isDragActive && "bg-accent border-primary"
                ),
              })}
            >
              {isDragActive ? (
                <span className="text-sm text-foreground">
                  Drop JSON/CSV file here
                </span>
              ) : (
                <div className="flex flex-col items-center justify-center text-sm text-foreground">
                  {file ? (
                    file.name
                  ) : (
                    <span>Choose a JSON/CSV file to import</span>
                  )}
                </div>
              )}
              <input {...getInputProps()} />
            </div>
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="autoId"
                defaultValue={true}
                render={({ onChange, value, ref }) => (
                  <Checkbox
                    id="import-auto-id"
                    ref={ref}
                    checked={value}
                    onCheckedChange={(c) => onChange(!!c)}
                  />
                )}
              />
              <Label htmlFor="import-auto-id">Auto generate ID</Label>
            </div>
            {idField}
            {fileType === "csv" && (
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="autoParseJSON"
                  defaultValue={true}
                  render={({ onChange, value, ref }) => (
                    <Checkbox
                      id="import-auto-parse-json"
                      ref={ref}
                      checked={value}
                      onCheckedChange={(c) => onChange(!!c)}
                    />
                  )}
                />
                <Label htmlFor="import-auto-parse-json">
                  Auto parse JSON value
                </Label>
              </div>
            )}
          </div>
        </form>
        <DialogFooter className="p-4">
          <Button variant="outline" size="sm" onClick={() => handleOnCancel()}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!formState.isValid || docs.length <= 0}
            onClick={handleSubmit(onSubmit)}
            type="submit"
          >
            Import {docs.length > 0 && `${docs.length} doc(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
