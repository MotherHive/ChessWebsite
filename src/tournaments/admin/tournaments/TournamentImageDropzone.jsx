"use client"

import { useRef, useState } from "react"
import { uploadAdminTournamentImage } from "../client"

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"]
const maxImageBytes = 4 * 1024 * 1024

export default function TournamentImageDropzone({ onChange, value }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState("idle")
  const [message, setMessage] = useState("")

  const uploadFile = async (file) => {
    if (!file) {
      return
    }

    if (!acceptedImageTypes.includes(file.type)) {
      setUploadState("error")
      setMessage("Use a JPG, PNG, or WebP image.")
      return
    }

    if (file.size > maxImageBytes) {
      setUploadState("error")
      setMessage("The image must be smaller than 4 MB.")
      return
    }

    setUploadState("uploading")
    setMessage("Uploading image…")

    try {
      const result = await uploadAdminTournamentImage(file)
      onChange(result.imageUrl)
      setUploadState("saved")
      setMessage("Banner uploaded. Save the tournament to keep this change.")
    } catch (error) {
      setUploadState("error")
      setMessage(error.message)
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const openFilePicker = () => {
    if (uploadState !== "uploading") {
      inputRef.current?.click()
    }
  }

  return (
    <div className="admin-image-field">
      <div
        aria-disabled={uploadState === "uploading"}
        className={`admin-image-dropzone${isDragging ? " admin-image-dropzone-dragging" : ""}`}
        onClick={openFilePicker}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false)
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = "copy"
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          uploadFile(event.dataTransfer.files[0])
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openFilePicker()
          }
        }}
        role="button"
        tabIndex={uploadState === "uploading" ? -1 : 0}
      >
        <input
          accept={acceptedImageTypes.join(",")}
          className="sr-only"
          onChange={(event) => uploadFile(event.target.files[0])}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
        {value ? (
          <img alt="Current tournament banner preview" src={value} />
        ) : (
          <span className="admin-image-dropzone-icon" aria-hidden="true">+</span>
        )}
        <strong>{uploadState === "uploading" ? "Uploading…" : "Drop a banner image here"}</strong>
        <span>or click to choose a JPG, PNG, or WebP file up to 4 MB</span>
      </div>
      <div className="admin-image-actions">
        {value && (
          <button
            className="button admin-remove-button"
            disabled={uploadState === "uploading"}
            onClick={() => {
              onChange("")
              setUploadState("idle")
              setMessage("Banner removed. Save the tournament to keep this change.")
            }}
            type="button"
          >
            Remove banner
          </button>
        )}
        {message && (
          <span
            className={uploadState === "error" ? "admin-error" : "admin-muted"}
            role="status"
          >
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
