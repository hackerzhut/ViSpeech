import { connect } from 'react-redux'
import { getProjectTokenList } from 'redux/token/token.actions'
import {
  getProjectInfo,
  updateProjectInfo,
  updateProjectInfoSuccess,
  updateProjectInfoFailure,
  onClearUpdateProjectInfoState,
} from 'redux/project/project.actions'
import ProjectDetailsPage from './ProjectDetailsPage.component'

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  getProjectTokenListObj: state.token.getProjectTokenList,
  getProjectInfoObj: state.project.getInfo,
  updateInfoObj: state.project.updateInfo,
})

const mapDispatchToProps = dispatch => ({
  clearUpdateProjectInfoState: () => dispatch(onClearUpdateProjectInfoState()),
  getProjectInfo: projectId => dispatch(getProjectInfo(projectId)),
  getProjectTokens: ({ userId, projectId, pagination, sortField, sortOrder, filters }) =>
    dispatch(getProjectTokenList({ userId, projectId, pagination, sortField, sortOrder, filters })),
  updateProjectInfo: (id, data) => dispatch(updateProjectInfo(id, data)),
  updateProjectInfoSuccess: () => dispatch(updateProjectInfoSuccess()),
  updateProjectInfoFailure: message => dispatch(updateProjectInfoFailure(message)),
})

const ProjectDetailsPageContainer = connect(mapStateToProps, mapDispatchToProps)(ProjectDetailsPage)

export default ProjectDetailsPageContainer
