/* eslint-disable no-shadow */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-underscore-dangle */
import React, { useState, useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import storage from 'firebaseStorage'
import {
  FILE_PATH,
  DEFAULT_PAGINATION,
  SORT_ORDER,
  STATUS,
  CUSTOMER_PATH,
  TIMEOUT_MILLISECONDS,
  DEFAULT_ERR_MESSAGE,
} from 'utils/constant'
import SpeechService from 'services/speech.service'
import SocketService from 'services/socket.service'
import RequestService from 'services/request.service'
import SocketUtils from 'utils/socket.util'
import InfoModal from 'components/common/InfoModal/InfoModal.component'
import SelectTokenForm from './components/SelectTokenForm/SelectTokenForm.container'
import RequestTable from './components/RequestTable/RequestTable.container'

const { Dragger } = Upload

const { KAFKA_TOPIC, invokeCheckSubject } = SocketUtils
const {
  REQUEST_CREATED_SUCCESS_EVENT,
  REQUEST_CREATED_FAILED_EVENT,
  REQUEST_UPDATED_SUCCESS_EVENT,
  REQUEST_UPDATED_FAILED_EVENT,
} = KAFKA_TOPIC

const TrialPage = ({
  currentUser,
  updateRequestInfoObj,
  getRequestListByUserId,
  clearUpdateRequestInfo,
  updateRequestInfo,
  updateRequestInfoSuccess,
  updateRequestInfoFailure,
}) => {
  const history = useHistory()
  const [draggerDisabled, setDraggerDisabled] = useState(true)
  const [tokenValue, setTokenValue] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [newRequest, setNewRequest] = useState({})
  const [infoModal, setInfoModal] = useState({})

  useEffect(() => {
    return () => clearUpdateRequestInfo()
  }, [clearUpdateRequestInfo])

  useEffect(() => {
    SocketService.socketOnListeningEvent(REQUEST_CREATED_SUCCESS_EVENT)
    SocketService.socketOnListeningEvent(REQUEST_CREATED_FAILED_EVENT)
    SocketService.socketOnListeningEvent(REQUEST_UPDATED_SUCCESS_EVENT)
    SocketService.socketOnListeningEvent(REQUEST_UPDATED_FAILED_EVENT)
  }, [])

  const closeInfoModal = useCallback(() => {
    setInfoModal(i => {
      return { ...i, visible: false }
    })
  }, [])

  const openInfoModal = useCallback(
    (title, message, isSuccess) => {
      setInfoModal({
        visible: true,
        title,
        message,
        icon: { isSuccess },
        button: {
          content: 'Đóng',
          clickFunc: () => {
            closeInfoModal()
          },
        },
        onCancel: () => closeInfoModal(),
      })
    },
    [closeInfoModal]
  )

  const refreshRequestList = useCallback(() => {
    setUploading(false)
    setNewRequest({})
    getRequestListByUserId(currentUser._id, {
      pagination: DEFAULT_PAGINATION.SIZE_5,
      sortField: 'createdDate',
      sortOrder: SORT_ORDER.DESC,
    })
  }, [getRequestListByUserId, currentUser._id])

  useEffect(() => {
    if (updateRequestInfoObj.isLoading === true) {
      setTimeout(() => {
        if (updateRequestInfoObj.isLoading === true) {
          updateRequestInfoFailure({ message: DEFAULT_ERR_MESSAGE })
        }
      }, TIMEOUT_MILLISECONDS)
    }
    if (updateRequestInfoObj.isLoading === false && updateRequestInfoObj.isSuccess != null) {
      if (updateRequestInfoObj.isSuccess === true) {
        openInfoModal('Yêu cầu dùng thử', 'Thành công', true)
      } else {
        openInfoModal('Yêu cầu dùng thử', 'Đã có lỗi xảy ra khi xử lí yêu cầu. Vui lòng thử lại sau!', false)
      }
      refreshRequestList()
      setTimeout(() => {
        closeInfoModal()
        history.push(`${CUSTOMER_PATH}/request-details/${updateRequestInfoObj.requestId}`)
      }, 1000)
    }
  }, [updateRequestInfoObj, updateRequestInfoFailure, history, openInfoModal, closeInfoModal, refreshRequestList])

  const updateRequest = async (requestId, transcriptFileUrl) => {
    if (!requestId) return

    updateRequestInfo(requestId, transcriptFileUrl)
    try {
      await RequestService.updateRequest(requestId, transcriptFileUrl)
      invokeCheckSubject.RequestUpdated.subscribe(data => {
        if (data.error != null) {
          updateRequestInfoFailure(data.errorObj)
        } else {
          updateRequestInfoSuccess(transcriptFileUrl)
        }
      })
    } catch (err) {
      updateRequestInfoFailure({ message: err.message })
    }
  }

  const callAsr = async (file, folder, url) => {
    let data = null
    try {
      data = await SpeechService.callAsr(file, url, tokenValue)
    } catch (err) {
      refreshRequestList()
      console.log(`Error while calling asr: ${err.message}`)
    }
    let requestCreatedSuccess = false
    invokeCheckSubject.RequestCreated.subscribe(data => {
      if (data.error != null) {
        //
      } else {
        requestCreatedSuccess = true
      }
    })
    setTimeout(() => {
      // invalid file || invalid token || not enough token minutes to request || cannot execute creating request
      if (requestCreatedSuccess === false) {
        refreshRequestList()
        openInfoModal('Yêu cầu dùng thử', 'Đã có lỗi xảy ra khi xử lí yêu cầu. Vui lòng thử lại sau!', false)
      } else if (requestCreatedSuccess === true && data && data.text) {
        const { requestId, text } = data
        const fileName = `transcript`
        const textFile = new File([new Blob([text], { type: 'text/plain;charset=utf-8' })], fileName, {
          type: 'text/plain;charset=utf-8',
        })
        const uploadTask = storage.ref(`${FILE_PATH}/${folder}/${fileName}`).put(textFile)
        uploadTask.on(
          'state_changed',
          snapshot => {
            Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            // setProgress(progressValue)
          },
          error => {
            refreshRequestList()
            openInfoModal('Yêu cầu dùng thử', 'Đã có lỗi xảy ra khi xử lí yêu cầu. Vui lòng thử lại sau!', false)
            console.log(`Error uploading transcript file: ${error.message}`)
          },
          () => {
            storage
              .ref(`${FILE_PATH}/${folder}`)
              .child(fileName)
              .getDownloadURL()
              .then(async transcriptFileUrl => {
                updateRequest(requestId, transcriptFileUrl)
                console.log(`Transcript file was uploaded with url ${transcriptFileUrl}`)
              })
          }
        )
      }
    }, TIMEOUT_MILLISECONDS)
  }

  const handleUpload = async ({ file, onProgress, onSuccess, onError }) => {
    setInfoModal({
      visible: true,
      title: 'Tải tập tin âm thanh',
      message: 'Đang tải...',
      icon: { isLoading: true },
      onCancel: () => closeInfoModal(),
    })

    if (!file) {
      openInfoModal('Tải tập tin âm thanh', 'Tập tin không tồn tại. Vui lòng chọn lại!', false)
      return
    }

    if (!tokenValue) {
      return
    }

    const request = {
      _id: 'vispeech',
      createdDate: Date.now(),
      duration: 0,
      fileName: file.name,
      projectName,
      status: {
        value: 'PENDING',
        name: STATUS.PENDING.viText,
        class: STATUS.PENDING.cssClass,
      },
      tokenName,
    }
    setNewRequest(request)
    setUploading(true)

    const fileName = `audio-${file.name}`
    const folder = `${Date.now()}`
    const uploadTask = storage.ref(`${FILE_PATH}/${folder}/${fileName}`).put(file)
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progressValue = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress({ percent: progressValue })
      },
      error => {
        setUploading(false)
        onError(error)
        openInfoModal('Tải tập tin âm thanh', 'Đã có lỗi xảy ra khi tải tập tin. Vui lòng thử lại sau!', false)
      },
      () => {
        storage
          .ref(`${FILE_PATH}/${folder}`)
          .child(fileName)
          .getDownloadURL()
          .then(async url => {
            onSuccess()
            openInfoModal('Tải tập tin âm thanh', 'Tải lên tập tin thành công!', true)
            setTimeout(() => {
              setInfoModal({
                visible: true,
                title: 'Yêu cầu dùng thử',
                message: 'Đang xử lí yêu cầu...',
                icon: { isLoading: true },
                onCancel: () => closeInfoModal(),
              })
            }, 1500)
            callAsr(file, folder, url)
          })
      }
    )
  }

  const props = {
    name: 'file',
    multiple: false,
    accept: 'audio/wav',
    customRequest: handleUpload,
    onChange(info) {
      const { status } = info.file
      if (status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (status === 'done') {
        console.log(`Tải file "${info.file.name}" thành công.`)
      } else if (status === 'error') {
        console.log(`Tải file "${info.file.name}" thất bại.`)
      }
    },
  }

  const onSelectTokenFormValuesChange = (project, token) => {
    setDraggerDisabled(true)
    if (project && token) {
      setTokenValue(token.value)
      setProjectName(project.name)
      setTokenName(token.name)
      setDraggerDisabled(false)
    }
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="card content-area">
          <div className="card-innr">
            <div className="card-head">
              <h4 className="card-title">Dùng thử</h4>
            </div>
            <SelectTokenForm uploading={uploading} onSelectTokenFormValuesChange={onSelectTokenFormValuesChange} />
            <Dragger {...props} disabled={draggerDisabled || uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Nhấn hoặc kéo thả tập tin âm thanh vào khu vực này để tải</p>
              <p className="ant-upload-hint">Chỉ nhận tập tin âm thanh có định dạng đuôi .wav</p>
            </Dragger>
            <RequestTable newRequest={newRequest} uploading={uploading} />
          </div>
        </div>
      </div>
      {infoModal.visible && <InfoModal infoModal={infoModal} />}
    </div>
  )
}

export default TrialPage
