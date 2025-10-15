from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Board, List, Card
from .serializers import (
    BoardSerializer,
    BoardListSerializer,
    ListSerializer,
    CardSerializer
)


class BoardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Board operations
    """
    queryset = Board.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return BoardListSerializer
        return BoardSerializer


class ListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for List operations
    """
    queryset = List.objects.all()
    serializer_class = ListSerializer

    def get_queryset(self):
        queryset = List.objects.all()
        board_id = self.request.query_params.get('board', None)
        if board_id is not None:
            queryset = queryset.filter(board_id=board_id)
        return queryset

    @action(detail=True, methods=['patch'])
    def update_position(self, request, pk=None):
        """Update list position"""
        list_obj = self.get_object()
        new_position = request.data.get('position')
        if new_position is not None:
            list_obj.position = new_position
            list_obj.save()
            serializer = self.get_serializer(list_obj)
            return Response(serializer.data)
        return Response(
            {'error': 'Position is required'},
            status=status.HTTP_400_BAD_REQUEST
        )


class CardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Card operations
    """
    queryset = Card.objects.all()
    serializer_class = CardSerializer

    def get_queryset(self):
        queryset = Card.objects.all()
        list_id = self.request.query_params.get('list', None)
        if list_id is not None:
            queryset = queryset.filter(list_id=list_id)
        return queryset

    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        """Move card to different list and/or position"""
        card = self.get_object()
        new_list_id = request.data.get('list_id')
        new_position = request.data.get('position')

        if new_list_id is not None:
            card.list_id = new_list_id
        if new_position is not None:
            card.position = new_position

        card.save()
        serializer = self.get_serializer(card)
        return Response(serializer.data)
