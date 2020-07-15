/* eslint-disable no-underscore-dangle */
/* eslint-disable no-alert */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect } from 'react'
import * as moment from 'moment'
import AntdTable from 'components/common/AntdTable/AntdTable.component'
import { DEFAULT_PAGINATION } from 'utils/constant'

const HistoriesPage = ({ requestListObj, getRequestList }) => {
  const columns = [
    {
      title: 'Mã API Key',
      dataIndex: 'tokenId',
      canSearch: true,
      render: tokenId => <span>{tokenId}</span>,
      width: 150,
    },
    {
      title: 'Tên file',
      dataIndex: 'fileName',
      canSearch: true,
      render: fileName => <span>{fileName}</span>,
      width: 180,
    },
    {
      title: 'Định dạng',
      dataIndex: 'mimeType',
      canSearch: true,
      render: mimeType => <span>{mimeType}</span>,
      width: 180,
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      sorter: true,
      render: size => <span>{size}</span>,
      width: 180,
    },
    {
      title: 'Mã dự án',
      dataIndex: 'projectId',
      canSearch: true,
      render: projectId => <span>{projectId}</span>,
      width: 150,
    },
    {
      title: 'Thời gian sử dụng (phút)',
      dataIndex: 'duration',
      sorter: true,
      render: duration => <span>{duration}</span>,
      width: 180,
      align: 'center',
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdDate',
      sorter: true,
      render: createdDate => moment(createdDate).format('DD/MM/YYYY HH:mm'),
      width: 200,
      align: 'center',
    },
  ]

  useEffect(() => {
    getRequestList({ pagination: DEFAULT_PAGINATION.SIZE_10 })
  }, [getRequestList])

  return (
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Lịch sử sử dụng dịch vụ</h4>
          </div>
          <div className="card-content">
            <div className="material-datatables">
              <AntdTable
                dataObj={requestListObj.requestList}
                columns={columns}
                fetchData={getRequestList}
                isLoading={requestListObj.isLoading}
                pageSize={DEFAULT_PAGINATION.SIZE_10.pageSize}
                scrollY={700}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoriesPage
