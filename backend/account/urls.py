from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UsersListView.as_view(), name='users_list'),
    path('users/me/', views.CurrentUserProfileView.as_view(), name='current-user-profile'),
    path('profile/<str:username>/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/<str:username>/properties', views.UserPropertiesView.as_view(), name='user_properties'),
    path('register/', views.RegisterUserView.as_view(), name='register_user'),
    path('update/', views.UpdateUserDetailsView.as_view(), name='update_user'),
    path('update/password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('delete/', views.DeleteUserView.as_view(), name='delete_user'),
    path('login/', views.LoginUserView.as_view(), name='login_user'),
    path('logout/', views.LogoutUserView.as_view(), name='logout_user'),
    path('favorite/', views.UserFavoritePropertiesView.as_view(), name='user_favorite_properties'),
    path('favorite/add/', views.AddToFavoritesView.as_view(), name='add_to_favorites'),
    path('favorite/remove/', views.RemoveFromFavoritesView.as_view(), name='remove_from_favorites'),    
]