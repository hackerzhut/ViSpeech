import { connect } from 'react-redux'
import {
  deleteProject,
  deleteProjectFailure,
  deleteProjectSuccess,
  getProjectList,
  onClearDeleteProjectState,
} from 'redux/project/project.actions'
import ProjectsPage from './ProjectsPage.component'

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  getProjectListObj: state.project.getProjectList,
  deleteProjectObj: state.project.deleteProject,
})

const mapDispatchToProps = dispatch => ({
  clearDeleteProjectState: () => dispatch(onClearDeleteProjectState()),
  getProjectList: ({ pagination, sortField, sortOrder, filters }) =>
    dispatch(getProjectList({ pagination, sortField, sortOrder, filters })),
  deleteProject: id => dispatch(deleteProject(id)),
  deleteProjectSuccess: () => dispatch(deleteProjectSuccess()),
  deleteProjectFailure: message => dispatch(deleteProjectFailure(message)),
})

const ProjectsPageContainer = connect(mapStateToProps, mapDispatchToProps)(ProjectsPage)

export default ProjectsPageContainer
